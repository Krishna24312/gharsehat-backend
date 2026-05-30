"""Fixed bilingual caregiver message templates.

No LLM-generated medical advice: every caregiver-facing message comes from
these fixed Hindi (Devanagari) and English templates. Hindi must stay in
Devanagari script — no Hinglish or Romanized Hindi.
"""

# Caregiver status messages keyed by message variant.
# Variants: green, amber, red (show doctor today), severe_red (call 108).
MESSAGES: dict[str, dict[str, str]] = {
    "green": {
        "english": "No significant change detected since yesterday. Continue dressing care as advised.",
        "hindi": "कल से कोई महत्वपूर्ण बदलाव नहीं दिखा है। डॉक्टर की सलाह के अनुसार ड्रेसिंग जारी रखें।",
    },
    "amber": {
        "english": "Some change detected. Watch closely and show this to your doctor at the next visit.",
        "hindi": "कुछ बदलाव दिखा है। ध्यान से निगरानी रखें और अगली मुलाकात में डॉक्टर को दिखाएँ।",
    },
    "red": {
        "english": "Significant change detected since yesterday. Please show this to your doctor today.",
        "hindi": "कल से महत्वपूर्ण बदलाव दिखा है। कृपया आज ही डॉक्टर को दिखाएँ।",
    },
    "severe_red": {
        "english": "Significant change detected with concerning symptoms. Call 108 immediately and take the patient to the nearest hospital.",
        "hindi": "चिंताजनक लक्षणों के साथ महत्वपूर्ण बदलाव दिखा है। तुरंत 108 पर कॉल करें और मरीज को नज़दीकी अस्पताल ले जाएँ।",
    },
}

# Shown on every response — this tool reports change, never a diagnosis.
DISCLAIMER_ENGLISH: str = "Not a medical diagnosis. Always consult your doctor."
DISCLAIMER_HINDI: str = "यह चिकित्सा निदान नहीं है। हमेशा अपने डॉक्टर से सलाह लें।"
