// Synthetic ASR Backend API Service
// Matches the actual deployed backend format (not the repo code!)

// JOB management endpoints (create/status/jobs) must always go through OUR backend
// Use API_BASE_URL (http://localhost:8000 by default) to avoid hitting dmubox-lite for jobs
import { API_BASE_URL } from '../shared/api/client';

// Prefer backend-relative path by default; allow override via env
// GENERATION endpoints (sample/*) may target dmubox-lite directly via env
const BASE_URL = process.env.REACT_APP_SYNTHETIC_ASR_API_URL || '/pai';
const JOBS_BASE_URL = `${API_BASE_URL}/pai`;
// Attach auth headers like the rest of the app (Bearer or anonymous token)
const authHeaders = () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    const anonymousToken = typeof localStorage !== 'undefined' ? localStorage.getItem('anonymous_token') : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    else if (anonymousToken) headers['X-Anonymous-Token'] = anonymousToken;
    return headers;
};

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
    is_sample: true,  // ⚠️ CRITICAL: synthetic-benchmarks requires this for /sample/* endpoints
    sentence: {
        category: formData.category,
        style: formData.sentenceStyles || [],
        description: overrides.description ?? (formData.description || ''),
        entities: formData.entities || '',
        topic_persona_instruction: overrides.topic_persona_instruction ?? (
            formData.personas
                ? formData.personas.map(p => `${p.topic} - ${p.persona}`).join(' | ')
                : ''
        ),
        sub_domain_instruction: overrides.sub_domain_instruction ?? (
            formData.subDomains
                ? formData.subDomains.join(' | ')
                : ''
        ),
        scenario_instruction: overrides.scenario_instruction ?? (
            formData.situations
                ? (formData.situations.map(s => (typeof s === 'string' ? s : (s?.scenario || ''))).filter(Boolean).join(' | '))
                : ''
        )
    }
});

/**
 * Stage 2: Generate Sub Domains
 */
export const generateSubDomains = async (formData, customPrompt) => {
    const config = buildConfig(formData, customPrompt ? { sub_domain_instruction: customPrompt } : {} );
    
    // Debug: log what we're sending
    if (!config.sentence || !config.sentence.category) {
        throw new Error('Category is required but was not provided. Please go back to Step 1 and select a category.');
    }
    
    const response = await fetch(`${BASE_URL}/sample/sub_domain`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ config })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('SubDomains API error:', response.status, error);
        throw new Error(error || `Failed to generate subdomains (Status: ${response.status})`);
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
    
    const response = await fetch(`${BASE_URL}/sample/topic_and_persona`, {
        method: 'POST',
        headers: authHeaders(),
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
        throw new Error(error || `Failed to generate personas (Status: ${response.status})`);
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

    const response = await fetch(`${BASE_URL}/sample/scenario`, {
        method: 'POST',
        headers: authHeaders(),
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
        throw new Error(error || `Failed to generate situations (Status: ${response.status})`);
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

    const response = await fetch(`${BASE_URL}/sample/sentence`, {
        method: 'POST',
        headers: authHeaders(),
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
        throw new Error(error || 'Failed to generate sentences');
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
export const createDataset = async (formData) => {
    const toTitle = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);
    const config = {
        ...buildConfig(formData),
        audio: {
            gender: (formData.audioConfig?.voices || []).map(toTitle), // expects ["Male","Female"]
            age_group: formData.audioConfig?.ageGroups || [],
            accent: toTitle(formData.audioConfig?.accent === 'custom' ? (formData.audioConfig?.customAccent || 'Normal') : (formData.audioConfig?.accent || 'Normal'))
        }
    };

    const url = `${JOBS_BASE_URL}/create`;
    const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ config })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create dataset');
    }
    // Backend returns plain text job_id
    const jobId = await response.text();
    return { jobId, status: response.status, url };
};

/**
 * Check Job Status
 */
export const getJobStatus = async (jobId) => {
    const response = await fetch(`${JOBS_BASE_URL}/status/${jobId}`, {
        method: 'GET',
        headers: authHeaders(),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to get job status');
    }

    // Backend now returns JSON with detailed progress info
    return await response.json();
};

/**
 * List all jobs with pagination and filtering
 */
export const getJobs = async (page = 1, limit = 10, status = 'all', language = 'all') => {
    // Require logged-in (non-anonymous) users for privacy
    const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!accessToken) {
        throw new Error('Sign in required to view your jobs.');
    }
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
    console.log('Fetching from:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: authHeaders(),
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(errorText || `HTTP ${response.status}: Failed to fetch jobs`);
        }

        const data = await response.json();
        console.log('API response data:', data);
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};
