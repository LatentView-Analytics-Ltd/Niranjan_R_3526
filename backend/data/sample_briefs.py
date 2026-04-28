"""
Sample campaign briefs from problem statement
Can be used for testing and demos
"""

SAMPLE_BRIEF_B2B_SAAS = {
    "campaign_name": "Q3 Enterprise Trial-to-Paid Push",
    "business_objective": "Convert 200 enterprise trial accounts (1000+ employees) to paid contracts before end of Q3. Secondary: generate 50 new enterprise demo requests from net-new prospects.",
    "target_audience": "Trial users at companies with 1000+ employees in the technology, financial services, and professional services sectors. Decision-maker titles: VP of Operations, Director of Revenue Operations, Chief Marketing Officer.",
    "key_message": "Teams that manage revenue operations at scale are leaving hours of manual work on the table. Our platform eliminates the reporting lag between data capture and decision — so your revenue team acts on what's happening now, not what happened last Tuesday.",
    "channels": "Email, LinkedIn, 'social' (unspecified), sales outreach",
    "budget": "Not specified",
    "timeline": "Campaign live by July 1, all assets locked by June 20",
    "success_metrics": "Trial-to-paid conversion rate (baseline: 14%, target: 22%); demo requests from net-new enterprise accounts (target: 50 in 6 weeks)",
    "constraints": "Do not reference competitors by name. All claims about time savings must be supported by customer quotes or case studies. Tone: confident and direct — not aggressive. Avoid jargon like 'AI-powered' without a concrete example of what the AI does."
}

SAMPLE_BRIEF_B2C_RETAIL = {
    "campaign_name": "Summer Re-Purchase Drive — Home & Garden",
    "business_objective": "Drive a 15% lift in repeat purchase rate among customers who bought in the Home & Garden category in the last 12 months but have not purchased in the last 90 days. Secondary: increase average order value by 10% through bundle promotion.",
    "target_audience": "Lapsed customers from the Home & Garden category. Primarily homeowners aged 35–55 who have purchased 2+ times historically. Email and SMS opted-in segment.",
    "key_message": "Your garden doesn't wait for the right moment. Neither do our summer prices.",
    "channels": "Email, SMS, social (Instagram and Facebook), loyalty program push notification",
    "budget": "$18,000 total. Email and SMS production: $3,000. Paid social: $12,000. Creative production: $3,000.",
    "timeline": "Campaign runs June 15 – July 31. Flash sale events: July 4 weekend and July 21.",
    "success_metrics": "Repeat purchase rate for target segment (baseline: 22%, target: 25%); average order value for purchases driven by campaign (baseline: $67, target: $74); email open rate >28%, SMS click rate >12%.",
    "constraints": "Flash sale must not cannibalize full-price demand from non-lapsed customers (use audience suppression for active buyers). Do not reference competitor pricing. Bundle promotion must be clearly labeled as limited-time. Brand tone: warm, enthusiastic, never pressuring. Avoid countdown timers in email (flagged by legal for EU audience)."
}

SAMPLE_BRIEFS = {
    "b2b_saas": SAMPLE_BRIEF_B2B_SAAS,
    "b2c_retail": SAMPLE_BRIEF_B2C_RETAIL,
}
