window.MARC_DATA = {
  app: {
    internalCodename: 'MARC',
    version: '1.3',
    publicName: 'CatalystFlow',
    tagline: 'Market intelligence powered by catalyst, flow, and regime signals.'
  },
  settings: {
    defaultTheme: 'dark',
    sourceFilters: ['public','premium_connected','sec_filing'],
    newsPolicy: {
      reliableSources: ['Reuters','AP','CNBC','Bloomberg (public pages when available)','Financial Times (public)','Yahoo Finance','MarketWatch','SEC EDGAR'],
      premiumPartnerPlan: 'Future optional Bloomberg / Wall Street Journal integration via user-entitled subscription linking.'
    }
  },
  universe: [
    {ticker:'AAPL', name:'Apple Inc.', sector:'Technology'},
    {ticker:'ABBV', name:'AbbVie Inc.', sector:'Healthcare'},
    {ticker:'ABNB', name:'Airbnb, Inc.', sector:'Consumer Discretionary'},
    {ticker:'ABT', name:'Abbott Laboratories', sector:'Healthcare'},
    {ticker:'ACN', name:'Accenture plc', sector:'Technology'},
    {ticker:'ADBE', name:'Adobe Inc.', sector:'Technology'},
    {ticker:'AMD', name:'Advanced Micro Devices', sector:'Technology'},
    {ticker:'AMZN', name:'Amazon.com, Inc.', sector:'Consumer Discretionary'},
    {ticker:'AVGO', name:'Broadcom Inc.', sector:'Technology'},
    {ticker:'AXP', name:'American Express', sector:'Financials'},
    {ticker:'BAC', name:'Bank of America', sector:'Financials'},
    {ticker:'CRM', name:'Salesforce, Inc.', sector:'Technology'},
    {ticker:'GOOGL', name:'Alphabet Inc.', sector:'Communication Services'},
    {ticker:'JPM', name:'JPMorgan Chase & Co.', sector:'Financials'},
    {ticker:'META', name:'Meta Platforms, Inc.', sector:'Communication Services'},
    {ticker:'MSFT', name:'Microsoft Corp.', sector:'Technology'},
    {ticker:'NFLX', name:'Netflix, Inc.', sector:'Communication Services'},
    {ticker:'NVDA', name:'NVIDIA Corp.', sector:'Technology'},
    {ticker:'TSLA', name:'Tesla, Inc.', sector:'Consumer Discretionary'},
    {ticker:'XOM', name:'Exxon Mobil Corp.', sector:'Energy'}
  ],
  marketOverview: {
    regime: 'Risk-On / Selective Momentum',
    stats: [
      {label:'Breadth', value:'61% > 20DMA', delta:'+4 pts'},
      {label:'Anomalies', value:'27 active', delta:'+6 vs open'},
      {label:'Dispersion', value:'High', delta:'Semis / Financials lead'},
      {label:'Volatility', value:'Moderate', delta:'Event-sensitive'}
    ],
    riskFlags:['Macro headline clustering','Semiconductor crowding','Opening gap reversals'],
    marketSeries:[100,101,100.5,102,103,102.6,103.4,104.1,103.8,104.6,105.2,104.9,105.6,106.1]
  },
  scanner: {
    columns:['Rank','Ticker','Company','Signal','Conf','Catalyst','RVOL','Regime Fit','Risk','Sector'],
    rows:[
      {rank:1,ticker:'NVDA',company:'NVIDIA Corp.',signal:89,confidence:82,catalyst:'AI supply-demand headlines + peer sympathy',rvol:2.6,regimeFit:'Strong',risk:'Crowded momentum',sector:'Technology'},
      {rank:2,ticker:'AMD',company:'Advanced Micro Devices',signal:84,confidence:77,catalyst:'Semi follow-through + breakout confirmation',rvol:2.2,regimeFit:'Strong',risk:'Gap fade risk',sector:'Technology'},
      {rank:3,ticker:'AVGO',company:'Broadcom Inc.',signal:80,confidence:74,catalyst:'Sector breadth expansion',rvol:1.9,regimeFit:'Strong',risk:'Lower liquidity than mega-caps',sector:'Technology'},
      {rank:4,ticker:'BAC',company:'Bank of America',signal:78,confidence:70,catalyst:'Rates move supports financials',rvol:1.8,regimeFit:'Good',risk:'Macro reversal',sector:'Financials'},
      {rank:5,ticker:'JPM',company:'JPMorgan Chase & Co.',signal:76,confidence:71,catalyst:'Financial sector leadership',rvol:1.6,regimeFit:'Good',risk:'Crowding if yields reverse',sector:'Financials'},
      {rank:6,ticker:'MSFT',company:'Microsoft Corp.',signal:75,confidence:69,catalyst:'Large-cap tech bid with lower novelty headlines',rvol:1.5,regimeFit:'Good',risk:'Relative strength lag vs semis',sector:'Technology'},
      {rank:7,ticker:'AAPL',company:'Apple Inc.',signal:72,confidence:65,catalyst:'Mixed product-chain chatter',rvol:1.3,regimeFit:'Neutral+',risk:'Muted reaction',sector:'Technology'},
      {rank:8,ticker:'AMZN',company:'Amazon.com, Inc.',signal:69,confidence:62,catalyst:'Consumer resilience read-through',rvol:1.4,regimeFit:'Neutral',risk:'Index-driven',sector:'Consumer Discretionary'},
      {rank:9,ticker:'TSLA',company:'Tesla, Inc.',signal:66,confidence:59,catalyst:'Delivery chatter',rvol:2.9,regimeFit:'Weak',risk:'Volatility spike',sector:'Consumer Discretionary'},
      {rank:10,ticker:'XOM',company:'Exxon Mobil Corp.',signal:64,confidence:60,catalyst:'Energy sensitivity to commodities',rvol:1.2,regimeFit:'Neutral',risk:'Commodity reversal',sector:'Energy'}
    ]
  },
  alerts:[
    {time:'09:42',level:'high',ticker:'NVDA',text:'Signal upgraded 81→89 after positive supply-chain headline + RVOL expansion to 2.6x.'},
    {time:'09:31',level:'med',ticker:'AMD',text:'Breakout confirmed above premarket high with broad semiconductor participation.'},
    {time:'09:12',level:'med',ticker:'BAC',text:'Rates-sensitive financials strengthening as yields tick higher.'},
    {time:'08:55',level:'low',ticker:'AAPL',text:'Mixed headlines; price response muted relative to peer group.'}
  ],
  news:[
    {id:1,source:'Reuters',source_type:'public',reliability:'High',credibility:'Tier 1',category:'Semiconductors',ticker:'NVDA',impact:92,novelty:78,time:'09:37',headline:'Chip demand commentary supports stronger-than-expected AI server orders',summary:'Public reporting suggests supply chain checks remain tight, reinforcing near-term sentiment in semis.'},
    {id:2,source:'CNBC',source_type:'public',reliability:'High',credibility:'Tier 1',category:'Macro',ticker:'SPY',impact:67,novelty:51,time:'09:22',headline:'Treasury yields edge up as traders assess policy path',summary:'Rates move may support banks while pressuring long-duration growth names intraday.'},
    {id:3,source:'SEC EDGAR',source_type:'sec_filing',reliability:'Primary',credibility:'Primary',category:'Filings',ticker:'TSLA',impact:61,novelty:65,time:'08:58',headline:'New filing update posted to EDGAR',summary:'Model flags filing as relevant; analyst review pending for materiality classification.'},
    {id:4,source:'AP',source_type:'public',reliability:'High',credibility:'Tier 1',category:'Consumer',ticker:'AMZN',impact:58,novelty:42,time:'08:44',headline:'Retail spending trends remain resilient in latest consumer update',summary:'Potential read-through for e-commerce and discretionary names.'},
    {id:5,source:'WSJ (linked)',source_type:'premium_connected',reliability:'High',credibility:'Premium',category:'Technology',ticker:'AAPL',impact:73,novelty:68,time:'09:40',headline:'Premium-connected sample headline shown only when user entitlement is enabled',summary:'Demonstrates future source entitlement plumbing in the UI; hidden unless premium source filter is active.'}
  ],
  tickers: {
    NVDA: {ticker:'NVDA',company:'NVIDIA Corp.',sector:'Technology / Semiconductors',score:89,confidence:82,regimeFit:'Strong',
      thesis:[
        'Catalyst-flow alignment: positive public semiconductor demand headlines + strong relative volume.',
        'Price holding above breakout area with sector confirmation across large-cap semis.',
        'Risk remains elevated around crowding and sharp intraday reversals after opening extension.'
      ],
      price:[910,918,925,932,928,940,948,952,946,958,964,971], volume:[40,44,52,60,57,71,76,69,64,82,88,91],
      factors:[{name:'News Impact',val:92},{name:'Flow Strength',val:88},{name:'Regime Fit',val:85},{name:'Volatility Risk',val:63},{name:'Crowding Risk',val:71}]},
    AAPL: {ticker:'AAPL',company:'Apple Inc.',sector:'Technology',score:72,confidence:65,regimeFit:'Neutral+', thesis:['Mixed headline quality with lower novelty.','Trend intact but weaker relative strength than semiconductor leaders.','Better for watchlist monitoring unless catalyst strengthens.'], price:[186,187,188,188,187,189,190,191,190,192,193,193], volume:[35,36,39,38,40,44,46,43,42,47,49,50], factors:[{name:'News Impact',val:58},{name:'Flow Strength',val:63},{name:'Regime Fit',val:74},{name:'Volatility Risk',val:38},{name:'Crowding Risk',val:46}]},
    AMD: {ticker:'AMD',company:'Advanced Micro Devices',sector:'Technology / Semiconductors',score:84,confidence:77,regimeFit:'Strong', thesis:['Sector sympathy remains supportive.','Breakout quality improved with broad volume expansion.','Monitor failure to hold VWAP in volatile tape.'], price:[166,168,170,171,170,173,174,175,174,176,178,179], volume:[31,35,40,45,44,53,57,55,49,60,63,66], factors:[{name:'News Impact',val:79},{name:'Flow Strength',val:85},{name:'Regime Fit',val:82},{name:'Volatility Risk',val:57},{name:'Crowding Risk',val:62}]}
  },
  scannerPresets:[
    {name:'Semis Momentum', query:'sector:Technology rvol>1.8 signal>75 catalyst:semi'},
    {name:'Financials Rates', query:'sector:Financials signal>70 regimefit:Good'},
    {name:'High RVOL Reversals', query:'rvol>2.5 risk:"Gap fade risk" OR risk:"Volatility spike"'}
  ]
};
