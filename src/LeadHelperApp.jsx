import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

const LeadHelperApp = () => {
  const [leadInput, setLeadInput] = useState('');
  const [todayDate, setTodayDate] = useState('2025-12-24');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeLead = () => {
    setIsAnalyzing(true);

    // Parse input
    const input = leadInput.trim();
    if (!input) {
      alert('Please paste a lead first');
      setIsAnalyzing(false);
      return;
    }

    // Extract fields from post
    const extracted = extractFields(input);

    // Calculate scores
    const scores = calculateScores(extracted);

    // Make decision
    const decision = makeDecision(scores, extracted);

    // Generate outreach
    const outreach = generateOutreach(decision, extracted, todayDate);

    // Generate CSV
    const csvRow = generateCSV(extracted, scores, decision, todayDate);

    setAnalysis({
      triage: decision,
      extracted,
      scores,
      outreach,
      csvRow
    });

    setIsAnalyzing(false);
  };

  const extractFields = (text) => {
    const lower = text.toLowerCase();

    // Platform detection
    let platform = 'Unknown';
    if (text.includes('linkedin.com') || text.includes('LinkedIn')) platform = 'LinkedIn';
    else if (text.includes('reddit.com') || text.includes('Reddit')) platform = 'Reddit';
    else if (text.includes('twitter.com') || text.includes('x.com')) platform = 'Twitter/X';
    else if (text.includes('facebook.com')) platform = 'Facebook';
    else if (text.includes('upwork.com')) platform = 'Upwork';

    // Contact method
    let contactMethod = 'Unknown';
    if (lower.includes('dm me') || lower.includes('send me a dm')) contactMethod = 'DM';
    else if (lower.includes('email') || lower.includes('@')) contactMethod = 'Email';
    else if (lower.includes('apply') || lower.includes('form')) contactMethod = 'Form';

    // Niche detection
    let niche = 'Unknown';
    if (lower.includes('podcast')) niche = 'Podcast';
    else if (lower.includes('fitness') || lower.includes('workout')) niche = 'Fitness';
    else if (lower.includes('finance') || lower.includes('trading')) niche = 'Finance';
    else if (lower.includes('education') || lower.includes('course')) niche = 'Education';
    else if (lower.includes('real estate')) niche = 'Real Estate';
    else if (lower.includes('coaching') || lower.includes('coach')) niche = 'Coaching';
    else if (lower.includes('gaming') || lower.includes('game')) niche = 'Gaming';
    else if (lower.includes('lifestyle') || lower.includes('vlog')) niche = 'Lifestyle';

    // Deliverable type
    let deliverableType = 'Unknown';
    let targetLength = 'Unknown';
    if (lower.includes('short') || lower.includes('reel') || lower.includes('tiktok')) {
      deliverableType = 'Shorts/Reels';
      targetLength = '15-60s';
    } else if (lower.includes('long') || lower.includes('youtube video')) {
      deliverableType = 'Longform YouTube';
      if (lower.includes('10-15 min') || lower.includes('10-20 min')) targetLength = '10-20 min';
      else if (lower.includes('5-10 min')) targetLength = '5-10 min';
      else targetLength = '8+ min';
    }

    // Cadence
    let cadence = 'Unknown';
    if (lower.includes('weekly') || lower.includes('per week') || lower.includes('/week')) {
      const weeklyMatch = text.match(/(\d+)\s*(video|reel|short).*week/i);
      if (weeklyMatch) cadence = `${weeklyMatch[1]}/week`;
      else cadence = 'Weekly';
    } else if (lower.includes('daily')) cadence = 'Daily';
    else if (lower.includes('monthly')) cadence = 'Monthly';

    // Tools
    const tools = [];
    if (lower.includes('capcut')) tools.push('CapCut');
    if (lower.includes('premiere') || lower.includes('pr')) tools.push('Premiere Pro');
    if (lower.includes('after effects') || lower.includes('ae')) tools.push('After Effects');
    if (lower.includes('davinci') || lower.includes('resolve')) tools.push('DaVinci Resolve');
    if (lower.includes('canva')) tools.push('Canva');

    // Needs detection
    const needs = [];
    if (lower.includes('caption') || lower.includes('subtitle')) needs.push('captions');
    if (lower.includes('stock') || lower.includes('b-roll') || lower.includes('b roll')) needs.push('stock_sourcing');
    if (lower.includes('ai voice') || lower.includes('tts') || lower.includes('text to speech')) needs.push('ai_voice_tts');
    if (lower.includes('music') || lower.includes('sound')) needs.push('music_sync');
    if (lower.includes('motion graphic') || lower.includes('animation')) {
      if (lower.includes('advanced') || lower.includes('complex')) needs.push('advanced_motion');
      else needs.push('basic_motion');
    }

    // What client provides vs must source
    let clientProvides = 'Unknown';
    let editorMustSource = 'Unknown';
    if (lower.includes('raw footage') || lower.includes('i provide') || lower.includes('i have')) {
      clientProvides = 'Raw footage';
      editorMustSource = 'Minimal';
    }
    if (needs.includes('stock_sourcing')) {
      editorMustSource = 'Stock footage, b-roll, music';
    }

    // Budget
    let budget = 'Unknown';
    const budgetMatch = text.match(/\$(\d+)(?:-\$?(\d+))?/);
    if (budgetMatch) {
      budget = budgetMatch[2] ? `$${budgetMatch[1]}-$${budgetMatch[2]}` : `$${budgetMatch[1]}`;
    } else if (lower.includes('budget') && lower.includes('negotiable')) {
      budget = 'Negotiable';
    }

    // Revisions
    let revisions = 'unknown';
    if (lower.includes('unlimited revision')) revisions = 'unlimited';
    else if (lower.includes('until perfect')) revisions = 'until perfect';
    else if (text.match(/(\d+)\s*revision/i)) {
      const rev = text.match(/(\d+)\s*revision/i);
      revisions = `${rev[1]} rounds`;
    }

    // Region fit
    let regionFit = 'UNKNOWN';
    if (lower.includes('usa') || lower.includes('us only') || lower.includes('united states') ||
        lower.includes('canada') || lower.includes('north america') || lower.includes('american')) {
      regionFit = 'YES';
    } else if (lower.includes('uk only') || lower.includes('europe only') || lower.includes('asia')) {
      regionFit = 'NO';
    }

    // Licensing risk
    let licensingRisk = 'LOW';
    let riskExplanation = 'Standard content';
    if (lower.includes('movie clip') || lower.includes('tv show') || lower.includes('copyrighted')) {
      licensingRisk = 'HIGH';
      riskExplanation = 'Requests copyrighted media clips';
    } else if (needs.includes('stock_sourcing')) {
      licensingRisk = 'MEDIUM';
      riskExplanation = 'Requires sourcing third-party content';
    }

    return {
      platform,
      postDate: 'Recent (within 7 days assumed)',
      contactMethod,
      niche,
      deliverableType,
      targetLength,
      cadence,
      clientProvides,
      editorMustSource,
      tools: tools.join(', ') || 'Not specified',
      needs,
      revisions,
      budget,
      language: 'English',
      regionFit,
      licensingRisk,
      riskExplanation,
      rawText: text
    };
  };

  const calculateScores = (extracted) => {
    const lower = extracted.rawText.toLowerCase();

    // FIT SCORE (0-50)
    let fitScore = 0;
    if (lower.includes('looking for') || lower.includes('hiring') || lower.includes('need editor')) fitScore += 25;
    if (extracted.tools.includes('CapCut')) fitScore += 15;
    if (extracted.needs.includes('captions')) fitScore += 10;
    if (extracted.needs.includes('stock_sourcing')) fitScore += 10;
    if (extracted.needs.includes('ai_voice_tts')) fitScore += 5;
    fitScore = Math.min(fitScore, 50);

    // COMPLEXITY SCORE (-20 to +20)
    let complexityScore = 0;
    if (lower.includes('same format') || lower.includes('repetitive') || lower.includes('consistent style')) complexityScore += 20;
    if (lower.includes('template') || lower.includes('preset')) complexityScore += 10;
    if (lower.includes('example') || lower.includes('reference') || lower.includes('youtube.com/')) complexityScore += 10;
    if (extracted.needs.includes('advanced_motion')) complexityScore -= 10;
    if (extracted.tools.includes('After Effects')) complexityScore -= 20;
    complexityScore = Math.max(Math.min(complexityScore, 20), -20);

    // COMMERCIAL VIABILITY (0-30)
    let commercialScore = 0;
    if (extracted.cadence !== 'Unknown' && extracted.cadence !== 'One-time') commercialScore += 15;
    if (extracted.budget !== 'Unknown' && !lower.includes('unpaid') && !lower.includes('exposure')) commercialScore += 10;
    if (extracted.deliverableType !== 'Unknown' && extracted.targetLength !== 'Unknown') commercialScore += 5;
    commercialScore = Math.min(commercialScore, 30);

    const totalScore = Math.max(0, Math.min(100, fitScore + complexityScore + commercialScore));

    // LEARNABILITY
    let learnability = 'GREEN';
    if (extracted.needs.includes('advanced_motion') || extracted.tools.includes('After Effects')) {
      learnability = 'RED';
    } else if (extracted.needs.includes('basic_motion') || extracted.deliverableType === 'Unknown') {
      learnability = 'YELLOW';
    }

    // SCOPE RISK
    let scopeRisk = 'LOW';
    if (extracted.needs.includes('advanced_motion') ||
        extracted.revisions === 'unlimited' ||
        extracted.revisions === 'until perfect' ||
        (extracted.deliverableType === 'Longform YouTube' && extracted.editorMustSource !== 'Minimal' && extracted.cadence.includes('week'))) {
      scopeRisk = 'HIGH';
    } else if ((extracted.budget === 'Unknown' && extracted.cadence === 'Unknown') ||
               extracted.deliverableType === 'Unknown') {
      scopeRisk = 'MEDIUM';
    }

    // EFFORT
    let effort = 'LOW';
    if (extracted.targetLength.includes('8+') || extracted.targetLength.includes('10-') ||
        extracted.editorMustSource !== 'Minimal' ||
        lower.includes('urgent') || lower.includes('asap')) {
      effort = 'HIGH';
    } else if (extracted.targetLength.includes('1-8') || extracted.targetLength.includes('min')) {
      effort = 'MEDIUM';
    }

    return {
      fitScore,
      complexityScore,
      commercialScore,
      totalScore,
      learnability,
      scopeRisk,
      effort
    };
  };

  const makeDecision = (scores, extracted) => {
    const lower = extracted.rawText.toLowerCase();

    // HARD SKIP checks
    if (lower.includes('filming') || lower.includes('on-camera') || lower.includes('in-person shoot')) {
      return {
        decision: 'SKIP',
        reasons: ['Requires filming/on-camera work (hard skip)']
      };
    }
    if (lower.includes('unpaid') || lower.includes('exposure only') || lower.includes('for exposure')) {
      return {
        decision: 'SKIP',
        reasons: ['Explicitly unpaid/exposure-only (hard skip)']
      };
    }
    if (extracted.needs.includes('advanced_motion') && extracted.tools.includes('After Effects')) {
      return {
        decision: 'SKIP',
        reasons: ['Primarily advanced VFX/AE work (hard skip)']
      };
    }

    // PASS criteria
    if (scores.totalScore >= 70 &&
        scores.fitScore >= 25 &&
        (scores.learnability === 'GREEN' || (scores.learnability === 'YELLOW' && scores.scopeRisk !== 'HIGH'))) {

      const reasons = [];
      if (scores.fitScore >= 40) reasons.push('Strong fit for SFF services');
      if (extracted.tools.includes('CapCut')) reasons.push('CapCut mentioned (perfect match)');
      if (extracted.cadence !== 'Unknown') reasons.push(`Recurring cadence: ${extracted.cadence}`);
      if (scores.learnability === 'GREEN') reasons.push('High learnability (GREEN)');

      return { decision: 'PASS', reasons };
    }

    // HOLD criteria
    if (scores.totalScore >= 50 && scores.totalScore < 70) {
      const reasons = ['Score in HOLD range (50-69)'];
      if (extracted.budget === 'Unknown') reasons.push('Budget not specified');
      if (extracted.cadence === 'Unknown') reasons.push('Cadence/volume unclear');

      return { decision: 'HOLD', reasons };
    }

    // SKIP
    const reasons = [];
    if (scores.totalScore < 50) reasons.push(`Low total score: ${scores.totalScore}`);
    if (scores.fitScore < 25) reasons.push(`Poor fit score: ${scores.fitScore}`);

    return { decision: 'SKIP', reasons };
  };

  const generateOutreach = (decision, extracted, today) => {
    if (decision.decision === 'SKIP') {
      return {
        skipNote: decision.reasons[0]
      };
    }

    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);
    const next24h = nextDay.toISOString().split('T')[0];

    const next3Days = new Date(today);
    next3Days.setDate(next3Days.getDate() + 3);
    const next72h = next3Days.toISOString().split('T')[0];

    // Build DM
    let dm = `Hey! I saw you're looking for a video editor`;

    if (extracted.deliverableType !== 'Unknown') {
      dm += ` for ${extracted.deliverableType.toLowerCase()}`;
    }
    if (extracted.niche !== 'Unknown') {
      dm += ` in the ${extracted.niche.toLowerCase()} space`;
    }
    dm += `. `;

    if (extracted.tools.includes('CapCut')) {
      dm += `I specialize in CapCut editing and work entirely on mobile. `;
    }

    if (extracted.needs.includes('captions')) {
      dm += `I can handle captions/subtitles. `;
    }

    if (extracted.needs.includes('stock_sourcing')) {
      dm += `I use licensed/rights-safe stock and platform-safe music sources. `;
    }

    dm += `\n\nQuick questions to see if we're a fit:\n`;
    dm += `1) How many videos per week?\n`;
    dm += `2) What's your typical turnaround expectation?\n`;
    dm += `3) What's your budget per video?\n`;

    if (extracted.rawText.toLowerCase().includes('portfolio') ||
        extracted.rawText.toLowerCase().includes('example') ||
        extracted.rawText.toLowerCase().includes('sample')) {
      dm += `\nI can share 2-3 relevant examples—happy to send them here/email.`;
    }

    // Follow-ups
    const followUp24 = `Hi again! Just wanted to bump this up in case you missed it. I'm actively taking on new clients this week and would love to help with your ${extracted.deliverableType !== 'Unknown' ? extracted.deliverableType.toLowerCase() : 'video editing'} needs.`;

    const followUp72 = `Hey! Last follow-up from me. If you're still looking for an editor, I'm available and ready to start. Let me know!`;

    if (decision.decision === 'PASS') {
      return { dm, followUp24, followUp72, next24h, next72h };
    } else {
      // HOLD - Clarifier DM
      let clarifierDM = `Hey! I'm interested in your video editing opportunity. `;

      clarifierDM += `To give you an accurate quote, could you clarify:\n`;
      clarifierDM += `1) How many videos per week?\n`;
      clarifierDM += `2) What's your typical turnaround expectation?\n`;
      clarifierDM += `3) What's your budget per video?\n`;

      // Add ONE extra question if critical
      if (extracted.editorMustSource === 'Unknown' && extracted.clientProvides === 'Unknown') {
        clarifierDM += `4) Will you provide raw footage/assets, or should I source stock content?\n`;
      } else if (extracted.revisions === 'unknown' && extracted.deliverableType === 'Longform YouTube') {
        clarifierDM += `4) What are your revision expectations?\n`;
      }

      if (extracted.rawText.toLowerCase().includes('portfolio') ||
          extracted.rawText.toLowerCase().includes('example')) {
        clarifierDM += `\nI can share 2-3 relevant examples—happy to send them here/email.`;
      }

      return {
        clarifierDM,
        followUp72: `Hey! Just circling back on this. If you can share those details, I'd be happy to put together a quote for you.`,
        next72h
      };
    }
  };

  const generateCSV = (extracted, scores, decision, today) => {
    const escape = (str) => {
      if (str === null || str === undefined) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const nextFollowUp = decision.decision === 'SKIP' ? '' :
                        decision.decision === 'PASS' ? '2025-12-25' : '2025-12-27';

    const url = extracted.rawText.match(/https?:\/\/[^\s]+/) ?
                extracted.rawText.match(/https?:\/\/[^\s]+/)[0] : '(none)';

    const fields = [
      today,
      url,
      extracted.platform,
      extracted.niche,
      extracted.deliverableType,
      extracted.targetLength,
      extracted.cadence,
      extracted.clientProvides,
      extracted.editorMustSource,
      extracted.tools,
      extracted.needs.join(' '),
      extracted.budget,
      extracted.language,
      extracted.regionFit,
      scores.totalScore,
      decision.decision,
      scores.learnability,
      scores.scopeRisk,
      scores.effort,
      getServiceMatch(extracted),
      'New',
      '',
      nextFollowUp,
      decision.reasons.join('; ')
    ];

    return fields.map(escape).join(',');
  };

  const getServiceMatch = (extracted) => {
    if (extracted.deliverableType === 'Shorts/Reels' && extracted.needs.includes('stock_sourcing')) {
      return 'AI Reel Edit';
    } else if (extracted.deliverableType === 'Shorts/Reels') {
      return 'Social Media Edit';
    } else if (extracted.needs.includes('captions')) {
      return 'Viral Captions';
    } else if (extracted.deliverableType === 'Longform YouTube' || extracted.niche === 'Podcast') {
      return 'Podcast/YouTube Repurpose';
    } else if (extracted.needs.includes('captions') && !extracted.needs.includes('stock_sourcing')) {
      return 'Auto Captions';
    } else {
      return 'Video Trim/Smart Cut';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getDecisionColor = (decision) => {
    switch(decision) {
      case 'PASS': return 'bg-green-100 border-green-500 text-green-800';
      case 'HOLD': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'SKIP': return 'bg-red-100 border-red-500 text-red-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getDecisionIcon = (decision) => {
    switch(decision) {
      case 'PASS': return <CheckCircle className="w-6 h-6" />;
      case 'HOLD': return <Clock className="w-6 h-6" />;
      case 'SKIP': return <XCircle className="w-6 h-6" />;
      default: return <AlertCircle className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Lead Helper</h1>
        <p className="text-gray-600 mb-6">ShortFormFactory Lead Analysis Tool</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Today's Date (YYYY-MM-DD)
          </label>
          <input
            type="date"
            value={todayDate}
            onChange={(e) => setTodayDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paste Lead (Post Text or URL)
          </label>
          <textarea
            value={leadInput}
            onChange={(e) => setLeadInput(e.target.value)}
            placeholder="Paste the hiring post text here, or include URL: https://..."
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        <button
          onClick={analyzeLead}
          disabled={isAnalyzing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition disabled:bg-gray-400"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Lead'}
        </button>
      </div>

      {analysis && (
        <div className="space-y-6">
          {/* BLOCK 1: TRIAGE */}
          <div className={`rounded-lg shadow-lg p-6 border-l-4 ${getDecisionColor(analysis.triage.decision)}`}>
            <div className="flex items-center gap-3 mb-4">
              {getDecisionIcon(analysis.triage.decision)}
              <h2 className="text-2xl font-bold">BLOCK 1 — TRIAGE</h2>
            </div>

            <div className="space-y-2">
              <p className="text-lg"><strong>Decision:</strong> {analysis.triage.decision}</p>
              <p><strong>Score:</strong> {analysis.scores.totalScore}/100</p>
              <p><strong>Learnability:</strong> {analysis.scores.learnability}</p>
              <p><strong>Scope risk:</strong> {analysis.scores.scopeRisk}</p>
              <p><strong>Estimated effort:</strong> {analysis.scores.effort}</p>
              <div>
                <strong>Top reasons:</strong>
                <ul className="list-disc ml-6 mt-1">
                  {analysis.triage.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(`Decision: ${analysis.triage.decision}\nScore: ${analysis.scores.totalScore}\nLearnability: ${analysis.scores.learnability}\nScope risk: ${analysis.scores.scopeRisk}\nEstimated effort: ${analysis.scores.effort}\nTop reasons:\n${analysis.triage.reasons.map(r => '- ' + r).join('\n')}`)}
              className="mt-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm"
            >
              Copy Block 1
            </button>
          </div>

          {/* BLOCK 2: EXTRACTED FIELDS */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">BLOCK 2 — EXTRACTED FIELDS</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Platform:</strong> {analysis.extracted.platform}</div>
              <div><strong>Post date/recency:</strong> {analysis.extracted.postDate}</div>
              <div><strong>Contact method:</strong> {analysis.extracted.contactMethod}</div>
              <div><strong>Niche:</strong> {analysis.extracted.niche}</div>
              <div><strong>Deliverable type:</strong> {analysis.extracted.deliverableType}</div>
              <div><strong>Target length:</strong> {analysis.extracted.targetLength}</div>
              <div><strong>Cadence/volume:</strong> {analysis.extracted.cadence}</div>
              <div><strong>Client provides:</strong> {analysis.extracted.clientProvides}</div>
              <div><strong>Editor must source:</strong> {analysis.extracted.editorMustSource}</div>
              <div><strong>Tools:</strong> {analysis.extracted.tools}</div>
              <div><strong>Needs:</strong> {analysis.extracted.needs.join(', ') || 'None specified'}</div>
              <div><strong>Revisions:</strong> {analysis.extracted.revisions}</div>
              <div><strong>Budget/rate:</strong> {analysis.extracted.budget}</div>
              <div><strong>Language:</strong> {analysis.extracted.language}</div>
              <div><strong>Region fit:</strong> {analysis.extracted.regionFit}</div>
              <div className="md:col-span-2">
                <strong>Reuse/licensing risk:</strong> {analysis.extracted.licensingRisk} ({analysis.extracted.riskExplanation})
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(`Platform: ${analysis.extracted.platform}\nPost date/recency: ${analysis.extracted.postDate}\nContact method: ${analysis.extracted.contactMethod}\nNiche: ${analysis.extracted.niche}\nDeliverable type: ${analysis.extracted.deliverableType}\nTarget length: ${analysis.extracted.targetLength}\nCadence/volume: ${analysis.extracted.cadence}\nClient provides: ${analysis.extracted.clientProvides}\nEditor must source: ${analysis.extracted.editorMustSource}\nTools: ${analysis.extracted.tools}\nNeeds: ${analysis.extracted.needs.join(', ')}\nRevisions: ${analysis.extracted.revisions}\nBudget/rate: ${analysis.extracted.budget}\nLanguage: ${analysis.extracted.language}\nRegion fit: ${analysis.extracted.regionFit}\nReuse/licensing risk: ${analysis.extracted.licensingRisk} (${analysis.extracted.riskExplanation})`)}
              className="mt-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm"
            >
              Copy Block 2
            </button>
          </div>

          {/* BLOCK 3: SERVICE MATCH */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">BLOCK 3 — SERVICE MATCH + PRICING BASIS</h2>

            <div className="space-y-2">
              <p><strong>Best matching SFF service:</strong> {getServiceMatch(analysis.extracted)}</p>
              <p><strong>Why this match:</strong> Matches deliverable type and requirements based on client needs</p>
              <p><strong>Pricing basis suggestion:</strong> {analysis.extracted.cadence !== 'Unknown' ? 'Per batch' : 'Per video'}</p>
              <p><strong>Quote anchor logic:</strong> Depends on length ({analysis.extracted.targetLength}) + sourcing burden ({analysis.extracted.editorMustSource}) + cadence ({analysis.extracted.cadence}) + revisions ({analysis.extracted.revisions})</p>
            </div>

            <button
              onClick={() => copyToClipboard(`Best matching SFF service: ${getServiceMatch(analysis.extracted)}\nWhy this match: Matches deliverable type and requirements\nPricing basis: ${analysis.extracted.cadence !== 'Unknown' ? 'Per batch' : 'Per video'}\nQuote anchor logic: Depends on length + sourcing + cadence + revisions`)}
              className="mt-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm"
            >
              Copy Block 3
            </button>
          </div>

          {/* BLOCK 4: OUTREACH */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">BLOCK 4 — OUTREACH</h2>

            {analysis.triage.decision === 'SKIP' ? (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p><strong>Skip note:</strong> {analysis.outreach.skipNote}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analysis.triage.decision === 'PASS' && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                      <strong className="block mb-2">Initial DM:</strong>
                      <p className="whitespace-pre-line text-sm">{analysis.outreach.dm}</p>
                      <button
                        onClick={() => copyToClipboard(analysis.outreach.dm)}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Copy DM
                      </button>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded p-4">
                      <strong className="block mb-2">Follow-up 24h ({analysis.outreach.next24h}):</strong>
                      <p className="text-sm">{analysis.outreach.followUp24}</p>
                      <button
                        onClick={() => copyToClipboard(analysis.outreach.followUp24)}
                        className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Copy 24h Follow-up
                      </button>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded p-4">
                      <strong className="block mb-2">Follow-up 72h ({analysis.outreach.next72h}):</strong>
                      <p className="text-sm">{analysis.outreach.followUp72}</p>
                      <button
                        onClick={() => copyToClipboard(analysis.outreach.followUp72)}
                        className="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Copy 72h Follow-up
                      </button>
                    </div>
                  </>
                )}

                {analysis.triage.decision === 'HOLD' && (
                  <>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                      <strong className="block mb-2">Clarifier DM:</strong>
                      <p className="whitespace-pre-line text-sm">{analysis.outreach.clarifierDM}</p>
                      <button
                        onClick={() => copyToClipboard(analysis.outreach.clarifierDM)}
                        className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Copy Clarifier DM
                      </button>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                      <strong className="block mb-2">Follow-up 72h ({analysis.outreach.next72h}):</strong>
                      <p className="text-sm">{analysis.outreach.followUp72}</p>
                      <button
                        onClick={() => copyToClipboard(analysis.outreach.followUp72)}
                        className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Copy 72h Follow-up
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* BLOCK 5: CSV LOG ROW */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">BLOCK 5 — LOG ROW (CSV)</h2>

            <div className="bg-gray-50 border border-gray-200 rounded p-4 overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all">{analysis.csvRow}</pre>
            </div>

            <button
              onClick={() => copyToClipboard(analysis.csvRow)}
              className="mt-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm"
            >
              Copy CSV Row
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadHelperApp;
