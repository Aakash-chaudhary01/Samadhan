const express = require('express');
const router = express.Router();
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Fallback FAQ dictionary for Civic Assistant in English & Hindi
const CIVIC_FAQS = [
  {
    keywords: ['pothole', 'road', 'सड़क', 'गड्ढा'],
    en: 'Potholes and broken roads are mapped to the Roads & Infrastructure department. Provide exact GPS coordinates and a clear photo to help the road repair squad locate the site quickly. Typical resolution SLA is 48 hours.',
    hi: 'सड़क के गड्ढे और टूटी सड़कों की समस्या सड़क और अवसंरचना विभाग (Roads & Infrastructure) के अधीन आती है। कृपया सटीक जीपीएस लोकेशन और फोटो सबमिट करें। सामान्यतः 48 घंटे में कार्यवाही की जाती है।',
  },
  {
    keywords: ['garbage', 'waste', 'trash', 'कचरा', 'सफाई'],
    en: 'Garbage accumulation or overflowing bins are routed directly to the Sanitation & Solid Waste department. Photos help us dispatch the appropriate loader vehicle. Average response time is 24 hours.',
    hi: 'कचरा या कूड़ेदान भरने की समस्या स्वच्छता और ठोस अपशिष्ट विभाग (Sanitation & Solid Waste) को भेजी जाती है। सामान्यतः 24 घंटे में सफाई दल भेजा जाता है।',
  },
  {
    keywords: ['streetlight', 'light', 'pole', 'बिजली', 'लाइट', 'अंधेरा'],
    en: 'Faulty or flickering streetlights are directed to the Electrical & Street Lighting department. Please specify the nearest pole number or landmark in the description.',
    hi: 'स्ट्रीट लाइट बंद होने या खराब खंभे की शिकायत विद्युत विभाग (Electrical & Street Lighting) को भेजी जाती है। विवरण में निकटतम खंभा नंबर या लैंडमार्क अवश्य लिखें।',
  },
  {
    keywords: ['water', 'leakage', 'drainage', 'नाली', 'पानी', 'सीवर'],
    en: 'Water pipeline leakages and sewage blockages are handled by the Water Supply & Sewerage division. Emergency leaks receive prioritized dispatch.',
    hi: 'पानी की पाइपलाइन रिसाव और सीवर जाम की समस्या जल आपूर्ति और सीवरेज विभाग द्वारा संभाली जाती है। आपातकालीन रिसाव को प्राथमिकता दी जाती है।',
  },
  {
    keywords: ['points', 'rewards', 'अंक', 'रिवॉर्ड', 'इनाम'],
    en: 'On Samadhan, you earn recognition points: 20 points for verified reporting, 10 points for helpful resolution feedback, and 30 points for verified community impact. Note: These are platform civic recognitions, not government cash benefits.',
    hi: 'समाधान पर आपको नागरिक पहचान अंक मिलते हैं: शिकायत दर्ज करने पर 20 अंक, फीडबैक पर 10 अंक और समाधान सत्यापन पर 30 अंक। ध्यान दें: यह मंच की नागरिक पहचान है, कोई सरकारी नकद लाभ नहीं।',
  },
  {
    keywords: ['government', 'official', 'सरकार', 'सरकारी', 'शिकायत'],
    en: 'Samadhan operates an open community-assisted tracking workflow. While municipal supervisors and workers use this system, you can also escalate critical grievances directly to official government portals like CPGRAMS (pgportal.gov.in) or your local municipal corporation portal.',
    hi: 'समाधान एक स्वतंत्र सामुदायिक समाधान प्रणाली है। यदि आप आधिकारिक सरकारी पोर्टल पर सीधे शिकायत दर्ज करना चाहते हैं, तो CPGRAMS (pgportal.gov.in) या नगर निगम की आधिकारिक वेबसाइट का भी उपयोग कर सकते हैं।',
  },
];

// 1. Chat assistant (Hindi & English)
router.post('/chat', async (req, res) => {
  const { message, language = 'en' } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required.' });
  }

  // Try calling Python FastAPI AI microservice
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/chat`, { message, language }, { timeout: 2000 });
    return res.json({
      success: true,
      serviceStatus: 'ai_service_online',
      source: 'fastapi_microservice',
      reply: response.data.reply,
      suggestedCategory: response.data.suggested_category || null,
    });
  } catch (err) {
    // Graceful honest fallback
    const lower = message.toLowerCase();
    const matchedFaq = CIVIC_FAQS.find((faq) => faq.keywords.some((kw) => lower.includes(kw)));

    let reply = '';
    if (matchedFaq) {
      reply = language === 'hi' ? matchedFaq.hi : matchedFaq.en;
    } else {
      reply =
        language === 'hi'
          ? 'नमस्ते! मैं समाधान नागरिक सहायक हूँ। आप सड़क के गड्ढे, कचरा, स्ट्रीट लाइट या सीवर की शिकायत के बारे में पूछ सकते हैं।'
          : 'Hello! I am the Samadhan Civic Assistant. You can ask me how to report potholes, garbage dumps, dark streetlights, or drainage overflow in your ward.';
    }

    return res.json({
      success: true,
      serviceStatus: 'rule_based_fallback',
      source: 'local_faq_engine',
      notice: 'AI microservice unavailable; honest rule-based civic assistant active.',
      reply,
    });
  }
});

// 2. Classify Image
router.post('/classify-image', async (req, res) => {
  const { imageUrl, fileName } = req.body;

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/classify`, { imageUrl, fileName }, { timeout: 2000 });
    return res.json({
      success: true,
      serviceStatus: 'ai_service_online',
      ...response.data,
    });
  } catch (err) {
    // Honest rule-based fallback based on filename or metadata
    const name = (fileName || imageUrl || '').toLowerCase();
    let category = 'Other Civic Issues';
    let confidence = null; // Honest: Never fake confidence scores

    if (name.includes('pothole') || name.includes('road')) category = 'Potholes & Road Damage';
    else if (name.includes('garbage') || name.includes('trash') || name.includes('waste')) category = 'Garbage & Waste Disposal';
    else if (name.includes('light') || name.includes('pole')) category = 'Streetlight & Electrical';
    else if (name.includes('water') || name.includes('drain') || name.includes('sewage')) category = 'Water Supply & Leakage';

    return res.json({
      success: true,
      serviceStatus: 'rule_based_fallback',
      category,
      confidenceScore: confidence,
      label: 'Rule-based heuristic tag (AI microservice offline)',
    });
  }
});

// 3. Priority & Department Suggestion
router.post('/suggest', async (req, res) => {
  const { title = '', description = '', category = '' } = req.body;

  const text = `${title} ${description}`.toLowerCase();
  let priority = 'medium';
  if (text.includes('accident') || text.includes('danger') || text.includes('fire') || text.includes('burst') || text.includes('urgent')) {
    priority = 'urgent';
  } else if (text.includes('major') || text.includes('hazard') || text.includes('overflow')) {
    priority = 'high';
  }

  const deptMap = {
    'Potholes & Road Damage': 'Roads & Infrastructure',
    'Illegal Construction & Encroachment': 'Roads & Infrastructure',
    'Garbage & Waste Disposal': 'Sanitation & Solid Waste',
    'Public Sanitation & Toilets': 'Sanitation & Solid Waste',
    'Streetlight & Electrical': 'Electrical & Street Lighting',
    'Water Supply & Leakage': 'Water Supply & Sewerage',
    'Drainage & Sewage Overflow': 'Water Supply & Sewerage',
    'Stray Animals & Pest Control': 'Public Health & Animal Welfare',
    'Other Civic Issues': 'Public Health & Animal Welfare',
  };

  return res.json({
    success: true,
    suggestedPriority: priority,
    suggestedDepartment: deptMap[category] || 'Roads & Infrastructure',
  });
});

module.exports = router;
