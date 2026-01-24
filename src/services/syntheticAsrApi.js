// Synthetic ASR Backend API Service
// Matches the actual deployed backend format (not the repo code!)

const BASE_URL = process.env.REACT_APP_SYNTHETIC_ASR_API_URL || 'https://dmubox-lite.centralindia.cloudapp.azure.com/pai';

// Utility to generate temp job ID
const generateTempJobId = () => {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
const buildConfig = (formData) => ({
    job_id: formData.job_id || generateTempJobId(),
    language: formData.language || 'hindi',
    size: Math.min(parseInt(formData.duration) || 1, 3), // Max 3 hours
    sentence: {
        category: formData.category,
        style: formData.sentenceStyles || [],
        description: formData.description || '',
        entities: formData.entities || '',
        topic_persona_instruction: formData.personas
            ? formData.personas.map(p => `${p.topic} - ${p.persona}`).join(' | ')
            : '',
        sub_domain_instruction: formData.subDomains
            ? formData.subDomains.join(' | ')
            : '',
        scenario_instruction: formData.situations
            ? formData.situations.join(' | ')
            : ''
    }
});

/**
 * Stage 2: Generate Sub Domains
 */
export const generateSubDomains = async (formData) => {
    const response = await fetch(`${BASE_URL}/sample/sub_domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            config: buildConfig(formData)
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to generate subdomains');
    }

    const data = await response.json();

    // Backend returns {sub_domain_0: "...", sub_domain_1: "...", ...}
    // Convert to array for frontend
    return Object.values(data.sub_domains || {});
};

/**
 * Stage 3: Generate Topics & Personas
 */
export const generatePersonas = async (formData) => {
    const response = await fetch(`${BASE_URL}/sample/topic_and_persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            config: buildConfig(formData),
            prompt_config: {
                sub_domains: arrayToIndexedObject(formData.subDomains, 'sub_domain')
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to generate personas');
    }

    const data = await response.json();

    // Backend returns {topic_0: {topic: "...", sub_domain: "..."}, ...}
    // and {persona_0: {persona: "...", sub_domain: "..."}, ...}
    // Convert to array of {topic, persona} objects
    const topics = Object.values(data.topics || {});
    const personas = Object.values(data.personas || {});

    // Match topics with personas (simplified - you may need better logic)
    return topics.map((topicObj, index) => ({
        topic: topicObj.topic,
        persona: personas[index]?.persona || 'Unknown'
    }));
};

/**
 * Stage 4: Generate Situations/Scenarios
 */
export const generateSituations = async (formData) => {
    // Build topics and personas in the weird format backend expects
    const topics = {};
    const personas = {};

    (formData.personas || []).forEach((p, index) => {
        topics[`topic_${index}`] = {
            topic: p.topic,
            sub_domain: `sub_domain_0` // Simplified - you may need better mapping
        };
        personas[`persona_${index}`] = {
            persona: p.persona,
            sub_domain: `sub_domain_0`
        };
    });

    const response = await fetch(`${BASE_URL}/sample/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            config: buildConfig(formData),
            prompt_config: {
                sub_domains: arrayToIndexedObject(formData.subDomains, 'sub_domain'),
                topics,
                personas
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to generate situations');
    }

    const data = await response.json();

    // Backend returns {scenario_0: {...}, scenario_1: {...}, ...}
    // Convert to array of scenario strings
    return Object.values(data.scenarios || {}).map(s => s.scenario || JSON.stringify(s));
};

/**
 * Stage 5: Generate Sample Sentences
 */
export const generateSentences = async (formData) => {
    // Build the complex prompt_config structure
    const topics = {};
    const personas = {};
    const scenarios = {};

    (formData.personas || []).forEach((p, index) => {
        topics[`topic_${index}`] = {
            topic: p.topic,
            sub_domain: `sub_domain_0`
        };
        personas[`persona_${index}`] = {
            persona: p.persona,
            sub_domain: `sub_domain_0`
        };
    });

    (formData.situations || []).forEach((s, index) => {
        scenarios[`scenario_${index}`] = {
            scenario: s,
            persona: `persona_0`,
            sub_domain: `sub_domain_0`,
            topic: `topic_0`
        };
    });

    const response = await fetch(`${BASE_URL}/sample/sentence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            config: buildConfig(formData),
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

    // Backend returns {sentence_0: "...", sentence_1: "...", ...}
    // Convert to array
    return Object.values(data.sentences || {});
};

/**
 * Stage 6: Create Dataset Job
 */
export const createDataset = async (formData) => {
    const config = {
        ...buildConfig(formData),
        audio: {
            gender: formData.audioConfig?.voices || [],
            age_group: formData.audioConfig?.ageGroups || []
        }
    };

    const response = await fetch(`${BASE_URL}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create dataset');
    }

    // Backend returns plain text job_id
    return await response.text();
};

/**
 * Check Job Status
 */
export const getJobStatus = async (jobId) => {
    const response = await fetch(`${BASE_URL}/status/${jobId}`, {
        method: 'GET'
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to get job status');
    }

    return await response.text();
};
