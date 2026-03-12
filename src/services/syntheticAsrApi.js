// Synthetic ASR API Service
// All requests go through our backend (API_BASE_URL/pai)
// Backend proxies to external service and handles CORS properly
import { API_BASE_URL, fetchWithAuth } from '../shared/api/client';

// All endpoints go through our backend at /pai
const JOBS_BASE_URL = `${API_BASE_URL}/pai`;

// authHeaders is no longer needed — fetchWithAuth handles auth + token refresh automatically

// Utility to generate numeric job ID (downstream expects integer)
const generateTempJobId = () => {
    return String(Date.now());
};

// Convert array to object with indexed keys (backend expects this weird format)
const arrayToIndexedObject = (arr, prefix) => {
    if (!arr || arr.length === 0) return {};
    return arr.reduce((obj, item, index) => {
        obj[`${prefix}_${index}`] = item;
        return obj;
    }, {});
};

// Build config object matching deployed backend format
// Optionally override sentence fields using the overrides object
const buildConfig = (formData, overrides = {}) => ({
    job_id: formData.job_id || generateTempJobId(),
    language: formData.language || 'hindi',
    size: Math.min(parseInt(formData.duration) || 1, 3), // Max 3 hours
    is_sample: overrides.is_sample !== undefined ? overrides.is_sample : true,  // Allows override for final jobs
    sentence: {
        category: formData.category,
        style: formData.sentenceStyles || [],
        description: overrides.description ?? (formData.description || ''),
        entities: formData.entities || '',
        topic_persona_instruction: overrides.topic_persona_instruction ?? (formData.personaCustomPrompt || ''),
        sub_domain_instruction: overrides.sub_domain_instruction ?? (formData.subDomainCustomPrompt || ''),
        scenario_instruction: overrides.scenario_instruction ?? (formData.scenarioCustomPrompt || '')
    }
});

/**
 * Stage 2: Generate Sub Domains
 */
export const generateSubDomains = async (formData, customPrompt) => {
    const config = buildConfig(formData, customPrompt ? { sub_domain_instruction: customPrompt } : {});

    // Debug: log what we're sending
    if (!config.sentence || !config.sentence.category) {
        throw new Error('Category is required but was not provided. Please go back to Step 1 and select a category.');
    }

    const response = await fetchWithAuth(`${JOBS_BASE_URL}/sample/sub_domain`, {
        method: 'POST',
        body: JSON.stringify({ config })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('SubDomains API error:', response.status, error);
        throw new Error('Server error occurred while generating sub-domains. Please try again.');
    }

    const data = await response.json();

    // Backend returns {sub_domain_0: "...", sub_domain_1: "...", ...}
    // Convert to array for frontend
    return Object.values(data.sub_domains || {});
};

/**
 * Stage 3: Generate Topics & Personas
 */
export const generatePersonas = async (formData, customPrompt) => {
    const config = buildConfig(formData, customPrompt ? { topic_persona_instruction: customPrompt } : {});

    if (!config.sentence || !config.sentence.category) {
        throw new Error('Category is required. Please go back to Step 1 and select a category.');
    }
    if (!formData.subDomains || formData.subDomains.length === 0) {
        throw new Error('Sub-domains are required. Please complete the previous step first.');
    }

    const response = await fetchWithAuth(`${JOBS_BASE_URL}/sample/topic_and_persona`, {
        method: 'POST',
        body: JSON.stringify({
            config: config,
            prompt_config: {
                sub_domains: arrayToIndexedObject(formData.subDomains, 'sub_domain')
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Personas API error:', response.status, error);
        throw new Error('Server error occurred while generating topics and personas. Please try again.');
    }

    const data = await response.json();

    // Backend returns {topic_0: {topic: "...", sub_domain: "sub_domain_0"}, ...}
    // and {persona_0: {persona: "...", sub_domain: "sub_domain_0"}, ...}

    // Build subdomain lookup map
    const subDomainMap = data.sub_domains || {};

    // Convert topics and personas to arrays with full context
    const topics = Object.entries(data.topics || {}).map(([key, topicObj]) => ({
        id: key,
        topic: topicObj.topic,
        subDomainId: topicObj.sub_domain,
        subDomain: subDomainMap[topicObj.sub_domain] || 'Unknown'
    }));

    const personas = Object.entries(data.personas || {}).map(([key, personaObj]) => ({
        id: key,
        persona: personaObj.persona,
        subDomainId: personaObj.sub_domain,
        subDomain: subDomainMap[personaObj.sub_domain] || 'Unknown'
    }));

    // Match topics with personas by subdomain
    return topics.map((topicObj, index) => {
        // Find matching persona with same subdomain
        const matchingPersona = personas.find(p => p.subDomainId === topicObj.subDomainId && personas.indexOf(p) === index)
            || personas[index];

        return {
            topic: topicObj.topic,
            persona: matchingPersona?.persona || 'Unknown',
            subDomain: topicObj.subDomain,
            subDomainId: topicObj.subDomainId
        };
    });
};

/**
 * Stage 4: Generate Situations/Scenarios
 */
export const generateSituations = async (formData, customPrompt) => {
    const config = buildConfig(formData, customPrompt ? { scenario_instruction: customPrompt } : {});

    if (!config.sentence || !config.sentence.category) {
        throw new Error('Category is required. Please go back to Step 1 and select a category.');
    }
    if (!formData.subDomains || formData.subDomains.length === 0) {
        throw new Error('Sub-domains are required. Please complete Step 2 first.');
    }
    if (!formData.personas || formData.personas.length === 0) {
        throw new Error('Personas are required. Please complete Step 3 first.');
    }

    // Build topics and personas in the weird format backend expects
    const topics = {};
    const personas = {};

    (formData.personas || []).forEach((p, index) => {
        topics[`topic_${index}`] = {
            topic: p.topic,
            sub_domain: p.subDomainId || `sub_domain_0` // Use preserved subdomain ID
        };
        personas[`persona_${index}`] = {
            persona: p.persona,
            sub_domain: p.subDomainId || `sub_domain_0`
        };
    });

    const response = await fetchWithAuth(`${JOBS_BASE_URL}/sample/scenario`, {
        method: 'POST',
        body: JSON.stringify({
            // If customPrompt provided, send as scenario_instruction override
            config: buildConfig(formData, customPrompt ? { scenario_instruction: customPrompt } : {}),
            prompt_config: {
                sub_domains: arrayToIndexedObject(formData.subDomains, 'sub_domain'),
                topics,
                personas
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Situations API error:', response.status, error);
        throw new Error('Server error occurred while generating scenarios. Please try again.');
    }

    const data = await response.json();

    // Build lookup maps
    const subDomainMap = data.sub_domains || {};
    const topicMap = data.topics || {};
    const personaMap = data.personas || {};

    // Backend returns {scenario_0: {scenario: "...", persona: "persona_0", topic: "topic_0", sub_domain: "sub_domain_0"}, ...}
    // Convert to array with full context
    return Object.values(data.scenarios || {}).map(scenarioObj => ({
        scenario: scenarioObj.scenario || JSON.stringify(scenarioObj),
        subDomain: subDomainMap[scenarioObj.sub_domain] || 'Unknown',
        topic: topicMap[scenarioObj.topic]?.topic || 'Unknown',
        persona: personaMap[scenarioObj.persona]?.persona || 'Unknown',
        // Keep IDs for reference
        subDomainId: scenarioObj.sub_domain,
        topicId: scenarioObj.topic,
        personaId: scenarioObj.persona
    }));
};

/**
 * Stage 5: Generate Sample Sentences
 */
export const generateSentences = async (formData, customPrompt) => {
    // Build the complex prompt_config structure
    const topics = {};
    const personas = {};
    const scenarios = {};

    (formData.personas || []).forEach((p, index) => {
        topics[`topic_${index}`] = {
            topic: p.topic,
            sub_domain: p.subDomainId || `sub_domain_0`
        };
        personas[`persona_${index}`] = {
            persona: p.persona,
            sub_domain: p.subDomainId || `sub_domain_0`
        };
    });

    (formData.situations || []).forEach((s, index) => {
        const scenarioText = typeof s === 'string' ? s : (s?.scenario || '');
        scenarios[`scenario_${index}`] = {
            scenario: scenarioText,
            persona: s?.personaId || `persona_0`,
            sub_domain: s?.subDomainId || `sub_domain_0`,
            topic: s?.topicId || `topic_0`
        };
    });

    const response = await fetchWithAuth(`${JOBS_BASE_URL}/sample/sentence`, {
        method: 'POST',
        body: JSON.stringify({
            // For sentences, we can use description to guide style/content
            config: buildConfig(formData, customPrompt ? { description: `${formData.description || ''} ${customPrompt}`.trim() } : {}),
            prompt_config: {
                sub_domains: arrayToIndexedObject(formData.subDomains, 'sub_domain'),
                topics,
                personas,
                scenarios
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Sentences API error:', response.status, error);
        throw new Error('Server error occurred while generating sentences. Please try again.');
    }

    const data = await response.json();

    // Normalize multiple possible shapes to a unified array of enriched objects
    // Prefer backend-provided metadata when present; otherwise derive from formData by index
    const toEnrichedArray = (arrLike) => {
        const deriveMeta = (i) => {
            // Default values
            let subDomain = '';
            let topic = '';
            let persona = '';
            let situation = '';

            // From situations (preferred when aligned)
            if (Array.isArray(formData.situations) && formData.situations.length > 0) {
                if (formData.situations.length === i + 1 || formData.situations.length === (Array.isArray(arrLike) ? arrLike.length : 0)) {
                    const s = formData.situations[i];
                    if (typeof s === 'string') situation = s;
                    else if (s && typeof s === 'object') {
                        situation = s.scenario || situation;
                        topic = s.topic || topic;
                        persona = s.persona || persona;
                        subDomain = s.subDomain || subDomain;
                    }
                }
            }

            // From personas fallback
            if (!topic || !persona) {
                const p = Array.isArray(formData.personas) && formData.personas.length > 0
                    ? formData.personas[Math.min(i, formData.personas.length - 1)]
                    : null;
                if (p && typeof p === 'object') {
                    topic = topic || p.topic || '';
                    persona = persona || p.persona || '';
                    subDomain = subDomain || p.subDomain || '';
                }
            }

            // From subDomains fallback
            if (!subDomain && Array.isArray(formData.subDomains) && formData.subDomains.length > 0) {
                const sd = formData.subDomains[Math.min(i, formData.subDomains.length - 1)];
                subDomain = typeof sd === 'string' ? sd : (sd?.subDomain || sd?.sub_domain || sd?.name || '');
            }
            return { subDomain, topic, persona, situation };
        };

        const coerce = (value, i) => {
            // If value already has sentence and metadata, prefer it
            if (value && typeof value === 'object') {
                const text = value.sentence ?? (typeof value === 'string' ? value : JSON.stringify(value));
                return {
                    sentence: text,
                    subDomain: value.subDomain || value.sub_domain || value.subdomain || deriveMeta(i).subDomain,
                    topic: value.topic || deriveMeta(i).topic,
                    persona: value.persona || deriveMeta(i).persona,
                    situation: value.scenario || value.situation || deriveMeta(i).situation,
                };
            }
            // String case
            return { sentence: String(value ?? ''), ...deriveMeta(i) };
        };

        // If array
        if (Array.isArray(arrLike)) {
            if (arrLike.length > 0 && typeof arrLike[0] === 'object' && arrLike[0]?.sentences) {
                // Case 3) [ { sentences: [...] } ]
                return (arrLike[0].sentences || []).map((v, i) => coerce(v, i));
            }
            return arrLike.map((v, i) => coerce(v, i));
        }
        // If object/dict
        if (arrLike && typeof arrLike === 'object') {
            const values = Object.values(arrLike);
            return values.map((v, i) => coerce(v, i));
        }
        return [];
    };

    if (Array.isArray(data)) {
        const first = data[0] || {};
        return toEnrichedArray(first.sentences || []);
    }
    return toEnrichedArray(data.sentences || []);
};

/**
 * Stage 6: Create Dataset Job
 */
export const createDataset = async (formData, isDraft = false, wizardStage = null) => {
    const toTitle = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);
    const config = {
        ...buildConfig(formData, { is_sample: false }), // Always set is_sample to false for final jobs
        audio: {
            gender: (formData.audioConfig?.voices || []).map(toTitle), // expects ["Male","Female"]
            age_group: formData.audioConfig?.ageGroups || [],
            accent: toTitle(formData.audioConfig?.accent === 'custom' ? (formData.audioConfig?.customAccent || 'Normal') : (formData.audioConfig?.accent || 'Normal'))
        }
    };

    const url = `${JOBS_BASE_URL}/create`;
    const bodyData = { config, is_draft: isDraft };
    if (isDraft) {
        if (wizardStage != null) bodyData.wizard_stage = wizardStage;
        // Ensure formData.job_id matches the config.job_id so the stored
        // wizard_form_data snapshot has the correct ID for future edits
        formData.job_id = config.job_id;
        bodyData.wizard_form_data = formData;
    }
    const response = await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Create dataset API error:', response.status, error);
        throw new Error('Server error occurred while creating the dataset job. Please try again.');
    }
    // Backend returns plain text job_id
    const jobId = await response.text();
    return { jobId, status: response.status, url };
};

/**
 * Resubmit a stuck/failed job
 */
export const resubmitJob = async (jobId) => {
    const response = await fetchWithAuth(`${JOBS_BASE_URL}/resubmit/${jobId}`, {
        method: 'POST',
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to resubmit job');
    }

    return { jobId: await response.text(), status: response.status };
};


/**
 * Report a failed job to the team for investigation
 */
export const reportFailedJob = async (jobId, message = '') => {
    const response = await fetchWithAuth(`${JOBS_BASE_URL}/report/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to report job');
    }

    return await response.json();
};

/**
 * Delete a draft job
 */
export const deleteDraftJob = async (jobId) => {
    const response = await fetchWithAuth(`${JOBS_BASE_URL}/draft/${jobId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete draft');
    }

    return await response.json();
};

/**
 * Check Job Status
 */
export const getJobStatus = async (jobId) => {
    const response = await fetchWithAuth(`${JOBS_BASE_URL}/status/${jobId}`, {
        method: 'GET',
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Get job status API error:', response.status, error);
        throw new Error('Server error occurred while fetching job status. Please try again.');
    }

    // Backend now returns JSON with detailed progress info
    return await response.json();
};

/**
 * List all jobs with pagination and filtering
 */
export const getJobs = async (page = 1, limit = 10, status = 'all', language = 'all') => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (status !== 'all') {
        params.append('status', status);
    }

    if (language !== 'all') {
        params.append('language', language);
    }

    const url = `${JOBS_BASE_URL}/jobs?${params.toString()}`;

    try {
        const response = await fetchWithAuth(url, {
            method: 'GET',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Get jobs API error:', response.status, errorText);
            throw new Error('Server error occurred while fetching your jobs. Please try again.');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};

/**
 * Get audio files for a specific job
 * @param {string} jobId - The job ID
 * @param {number} limit - Maximum number of audio files to fetch (default: 100)
 * @returns {Promise} Array of audio objects with id, sentence, metric, duration
 */
export const getJobAudios = async (jobId, limit = 100) => {
    const url = `${JOBS_BASE_URL}/job/${jobId}?limit=${limit}`;

    const response = await fetchWithAuth(url, {
        method: 'GET',
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Get audio files API error:', response.status, error);
        throw new Error('Server error occurred while fetching audio files. Please try again.');
    }

    return await response.json();
};

/**
 * Get audio file URL for a specific audio ID
 * @param {number|string} audioId - The audio ID
 * @returns {string} URL to fetch the audio file
 */
export const getAudioUrl = (audioId) => {
    return `${JOBS_BASE_URL}/audio/${audioId}`;
};

/**
 * Get dataset metrics for a specific job
 * @param {string} jobId - The job ID
 * @returns {Promise} Metrics object with totalAudio, vocabularySize, totalTokens, totalDuration
 */
export const getJobMetrics = async (jobId) => {
    const url = `${JOBS_BASE_URL}/metrics/${jobId}`;

    const response = await fetchWithAuth(url, {
        method: 'GET',
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Get metrics API error:', response.status, error);
        throw new Error('Server error occurred while fetching metrics. Please try again.');
    }

    return await response.json();
};

/**
 * Get download link for a specific job's dataset
 * @param {string} jobId - The job ID
 * @returns {Promise} Response with download URL or file
 */
export const getDownloadLink = async (jobId) => {
    const url = `${JOBS_BASE_URL}/download/${jobId}`;

    const response = await fetchWithAuth(url, {
        method: 'GET',
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Get download link API error:', response.status, error);
        throw new Error('Server error occurred while getting download link. Please try again.');
    }

    return await response.json();
};
