// Thymos Health — client-side site search index + matcher.
//
// This is a static marketing site (public/*.dc.html + public/*.html), not a
// server-rendered app, so there is no live search backend to query. This file
// is loaded on every marketing page (alongside ./support.js) and exposes
// `window.thymosSiteSearch(query)`, called from each page's footer search
// form. It looks the query up against a small static index of the site's own
// pages plus the 149 conditions in all_diseases.json (kept in sync manually —
// re-run the generator described in the repo if all_diseases.json changes),
// and falls back to an external, domain-scoped Google search when nothing
// on the site matches closely enough.
(function () {
  "use strict";

  var PAGES = [
    { title: "Home", url: "thymos-homepage.dc.html", keywords: ["home", "homepage", "autoimmune care", "thymos health"] },
    { title: "How We Work", url: "thymos-how-we-work.dc.html", keywords: ["how we work", "how it works", "process", "journey", "faq", "frequently asked questions", "help center"] },
    { title: "Proven Approach", url: "thymos-proven-approach.dc.html", keywords: ["proven approach", "results", "outcomes", "evidence"] },
    { title: "Conditions Treated", url: "thymos-conditions-treated.dc.html", keywords: ["conditions treated", "150+ diseases", "autoimmune disorders", "diseases", "disorders"] },
    { title: "For Employers", url: "thymos-for-employers.dc.html", keywords: ["employers", "employer benefits", "hr", "pmpm", "benefits team"] },
    { title: "Health Systems", url: "thymos-health-systems.dc.html", keywords: ["health systems", "hospitals", "specialist capacity"] },
    { title: "For Providers", url: "thymos-providers.dc.html", keywords: ["providers", "referring providers", "co-manage", "physicians", "provider referral"] },
    { title: "Refer a Patient", url: "thymos-refer-a-patient.dc.html", keywords: ["refer a patient", "referral form", "provider referral"] },
    { title: "About Us", url: "thymos-about-us.dc.html", keywords: ["about us", "our story", "mission", "team", "dr. payal bhandari"] },
    { title: "Privacy Policy", url: "thymos-privacy-policy.dc.html", keywords: ["privacy policy", "privacy", "data"] },
    { title: "Terms of Service", url: "thymos-terms-of-service.dc.html", keywords: ["terms of service", "terms & conditions", "terms and conditions"] },
    { title: "Start My Quiz", url: "/quiz", keywords: ["quiz", "get started", "intake", "start my quiz", "sign up", "contact us", "contact"] }
  ];

  // Dedicated patient-journey pages, keyed by the short display names used
  // on the homepage's own condition buttons — listed ahead of the generic
  // CONDITIONS index below so a plain "lupus"/"crohn's" search lands on the
  // richer journey page instead of the generic Condition Detail stub (an
  // exact title match always outscores a substring match, see localMatch).
  var JOURNEYS = [
    { title: "Crohn's Disease", url: "patient-journey_crohns-disease.html", keywords: ["crohns", "crohn's", "crohns disease"] },
    { title: "Multiple Sclerosis", url: "patient-journey_multiple-sclerosis.html", keywords: ["ms"] },
    { title: "Lupus", url: "patient-journey_lupus.html", keywords: [] },
    { title: "Rheumatoid Arthritis", url: "patient-journey_rheumatoid-arthritis.html", keywords: ["ra"] },
    { title: "Myasthenia Gravis", url: "patient-journey_myasthenia-gravis.html", keywords: [] },
    { title: "Ulcerative Colitis", url: "patient-journey_ulcerative-colitis.html", keywords: ["uc"] },
    { title: "Sjögren's Syndrome", url: "patient-journey_sjogrens-syndrome.html", keywords: ["sjogrens", "sjogren's", "sjogren's syndrome"] },
    { title: "Psoriasis", url: "patient-journey_psoriasis.html", keywords: [] },
    { title: "Guillain-Barré Syndrome", url: "patient-journey_guillain-barre-syndrome.html", keywords: ["guillain-barre", "guillain barre", "gbs"] },
    { title: "Alopecia Areata", url: "patient-journey_alopecia-areata.html", keywords: [] },
    { title: "Ankylosing Spondylitis", url: "patient-journey_ankylosing-spondylitis.html", keywords: [] },
    { title: "Hepatitis", url: "patient-journey_hepatitis.html", keywords: [] },
    { title: "Myositis", url: "patient-journey_myositis.html", keywords: [] },
    { title: "Hashimoto's Thyroiditis", url: "patient-journey_hashimotos-thyroiditis.html", keywords: ["hashimotos", "hashimoto's"] }
  ];

  // Condition index — mirrors public/all_diseases.json (name -> slug).
  var CONDITIONS = [
  { title: 'Acquired hemophilia', url: 'thymos-condition-detail.dc.html?slug=acquired-hemophilia', kind: 'condition' },
  { title: 'Acromegaly', url: 'thymos-condition-detail.dc.html?slug=acromegaly', kind: 'condition' },
  { title: 'Agammaglobulinemia', url: 'thymos-condition-detail.dc.html?slug=agammaglobulinemia', kind: 'condition' },
  { title: 'Alopecia areata', url: 'thymos-condition-detail.dc.html?slug=alopecia-areata', kind: 'condition' },
  { title: 'Amyloidosis', url: 'thymos-condition-detail.dc.html?slug=amyloidosis', kind: 'condition' },
  { title: 'Ankylosing spondylitis', url: 'thymos-condition-detail.dc.html?slug=ankylosing-spondylitis', kind: 'condition' },
  { title: 'Anti-NMDA receptor encephalitis', url: 'thymos-condition-detail.dc.html?slug=anti-nmda-receptor-encephalitis', kind: 'condition' },
  { title: 'Antiphospholipid syndrome', url: 'thymos-condition-detail.dc.html?slug=antiphospholipid-syndrome', kind: 'condition' },
  { title: 'Aplastic anemia', url: 'thymos-condition-detail.dc.html?slug=aplastic-anemia', kind: 'condition' },
  { title: 'Arteriosclerosis', url: 'thymos-condition-detail.dc.html?slug=arteriosclerosis', kind: 'condition' },
  { title: 'Autoimmune Addison’s disease', url: 'thymos-condition-detail.dc.html?slug=autoimmune-addisons-disease', kind: 'condition' },
  { title: 'Autoimmune angioedema', url: 'thymos-condition-detail.dc.html?slug=autoimmune-angioedema', kind: 'condition' },
  { title: 'Autoimmune autonomic ganglionopathy', url: 'thymos-condition-detail.dc.html?slug=autoimmune-autonomic-ganglionopathy', kind: 'condition' },
  { title: 'Autoimmune encephalitis / acute disseminated encephalomyelitis (ADEM)', url: 'thymos-condition-detail.dc.html?slug=acute-disseminated-encephalomyelitis', kind: 'condition' },
  { title: 'Autoimmune gastritis', url: 'thymos-condition-detail.dc.html?slug=autoimmune-gastritis', kind: 'condition' },
  { title: 'Autoimmune hemolytic anemia', url: 'thymos-condition-detail.dc.html?slug=autoimmune-hemolytic-anemia', kind: 'condition' },
  { title: 'Autoimmune hepatitis', url: 'thymos-condition-detail.dc.html?slug=autoimmune-hepatitis', kind: 'condition' },
  { title: 'Autoimmune hyperlipidemia', url: 'thymos-condition-detail.dc.html?slug=autoimmune-hyperlipidemia', kind: 'condition' },
  { title: 'Autoimmune hypophysitis / lymphocytic hypophysitis', url: 'thymos-condition-detail.dc.html?slug=autoimmune-hypophysitis', kind: 'condition' },
  { title: 'Autoimmune inner ear disease', url: 'thymos-condition-detail.dc.html?slug=autoimmune-inner-ear-disease', kind: 'condition' },
  { title: 'Autoimmune lymphoproliferative syndrome', url: 'thymos-condition-detail.dc.html?slug=autoimmune-lymphoproliferative-syndrome', kind: 'condition' },
  { title: 'Autoimmune myelofibrosis', url: 'thymos-condition-detail.dc.html?slug=autoimmune-myelofibrosis', kind: 'condition' },
  { title: 'Autoimmune myocarditis', url: 'thymos-condition-detail.dc.html?slug=autoimmune-myocarditis', kind: 'condition' },
  { title: 'Autoimmune oophoritis', url: 'thymos-condition-detail.dc.html?slug=autoimmune-oophoritis', kind: 'condition' },
  { title: 'Autoimmune pancreatitis', url: 'thymos-condition-detail.dc.html?slug=autoimmune-pancreatitis', kind: 'condition' },
  { title: 'Autoimmune polyglandular syndromes', url: 'thymos-condition-detail.dc.html?slug=autoimmune-polyglandular-syndromes', kind: 'condition' },
  { title: 'Autoimmune progesterone dermatitis', url: 'thymos-condition-detail.dc.html?slug=autoimmune-progesterone-dermatitis', kind: 'condition' },
  { title: 'Autoimmune retinopathy', url: 'thymos-condition-detail.dc.html?slug=autoimmune-retinopathy', kind: 'condition' },
  { title: 'Autoimmune sudden sensorineural hearing loss', url: 'thymos-condition-detail.dc.html?slug=autoimmune-sudden-sensorineural-hearing-loss', kind: 'condition' },
  { title: 'Balo disease / concentric sclerosis', url: 'thymos-condition-detail.dc.html?slug=balo-disease', kind: 'condition' },
  { title: 'Behçet’s disease', url: 'thymos-condition-detail.dc.html?slug=behcets', kind: 'condition' },
  { title: 'Birdshot chorioretinopathy', url: 'thymos-condition-detail.dc.html?slug=birdshot-chorioretinopathy', kind: 'condition' },
  { title: 'Bullous pemphigoid', url: 'thymos-condition-detail.dc.html?slug=bullous-pemphigoid', kind: 'condition' },
  { title: 'Castleman disease', url: 'thymos-condition-detail.dc.html?slug=castleman-disease', kind: 'condition' },
  { title: 'Celiac disease', url: 'thymos-condition-detail.dc.html?slug=celiac-disease', kind: 'condition' },
  { title: 'Chagas disease', url: 'thymos-condition-detail.dc.html?slug=chagas-disease', kind: 'condition' },
  { title: 'Chronic autoimmune urticaria', url: 'thymos-condition-detail.dc.html?slug=chronic-urticaria', kind: 'condition' },
  { title: 'Chronic inflammatory demyelinating polyneuropathy', url: 'thymos-condition-detail.dc.html?slug=chronic-inflammatory-demyelinating-polyneuropathy', kind: 'condition' },
  { title: 'Churg-Strauss syndrome', url: 'thymos-condition-detail.dc.html?slug=churg-strauss-syndrome', kind: 'condition' },
  { title: 'Cogan’s syndrome', url: 'thymos-condition-detail.dc.html?slug=cogan-syndrome', kind: 'condition' },
  { title: 'Cold agglutinin disease', url: 'thymos-condition-detail.dc.html?slug=cold-agglutinin-disease', kind: 'condition' },
  { title: 'CREST syndrome', url: 'thymos-condition-detail.dc.html?slug=crest-syndrome', kind: 'condition' },
  { title: 'Crohn’s disease', url: 'thymos-condition-detail.dc.html?slug=crohns-disease', kind: 'condition' },
  { title: 'Cronkhite-Canada syndrome', url: 'thymos-condition-detail.dc.html?slug=cronkhite-canada-syndrome', kind: 'condition' },
  { title: 'Cryptogenic organizing pneumonia', url: 'thymos-condition-detail.dc.html?slug=cryptogenic-organizing-pneumonia', kind: 'condition' },
  { title: 'Dermatitis herpetiformis', url: 'thymos-condition-detail.dc.html?slug=dermatitis-herpetiformis', kind: 'condition' },
  { title: 'Dermatomyositis', url: 'thymos-condition-detail.dc.html?slug=dermatomyositis', kind: 'condition' },
  { title: 'Discoid lupus', url: 'thymos-condition-detail.dc.html?slug=discoid-lupus', kind: 'condition' },
  { title: 'Dressler’s syndrome', url: 'thymos-condition-detail.dc.html?slug=dresslers-syndrome', kind: 'condition' },
  { title: 'Eczema / atopic dermatitis', url: 'thymos-condition-detail.dc.html?slug=eczema', kind: 'condition' },
  { title: 'Endometriosis', url: 'thymos-condition-detail.dc.html?slug=endometriosis', kind: 'condition' },
  { title: 'Eosinophilic esophagitis / eosinophilic gastroenteritis', url: 'thymos-condition-detail.dc.html?slug=eosinophilic-esophagitis', kind: 'condition' },
  { title: 'Eosinophilic fasciitis', url: 'thymos-condition-detail.dc.html?slug=eosinophilic-fasciitis', kind: 'condition' },
  { title: 'Erythema nodosum', url: 'thymos-condition-detail.dc.html?slug=erythema-nodosum', kind: 'condition' },
  { title: 'Essential mixed cryoglobulinemia', url: 'thymos-condition-detail.dc.html?slug=essential-mixed-cryoglobulinemia', kind: 'condition' },
  { title: 'Evans syndrome', url: 'thymos-condition-detail.dc.html?slug=evans-syndrome', kind: 'condition' },
  { title: 'Fibromyalgia', url: 'thymos-condition-detail.dc.html?slug=fibromyalgia', kind: 'condition' },
  { title: 'Fibrosing alveolitis / idiopathic pulmonary fibrosis', url: 'thymos-condition-detail.dc.html?slug=fibrosing-alveolitis', kind: 'condition' },
  { title: 'Giant cell arteritis / temporal arteritis / Horton’s disease', url: 'thymos-condition-detail.dc.html?slug=giant-cell-arteritis-temporal-arteritis-hortons-disease', kind: 'condition' },
  { title: 'Giant cell myocarditis', url: 'thymos-condition-detail.dc.html?slug=giant-cell-myocarditis', kind: 'condition' },
  { title: 'Glomerulonephritis', url: 'thymos-condition-detail.dc.html?slug=glomerulonephritis', kind: 'condition' },
  { title: 'Goodpasture’s syndrome / anti-GBM / anti-TBM disease', url: 'thymos-condition-detail.dc.html?slug=goodpastures-syndrome', kind: 'condition' },
  { title: 'Granulomatosis with polyangiitis / Wegener’s granulomatosis', url: 'thymos-condition-detail.dc.html?slug=wegeners', kind: 'condition' },
  { title: 'Graves’ disease', url: 'thymos-condition-detail.dc.html?slug=graves-disease', kind: 'condition' },
  { title: 'Guillain-Barrè syndrome', url: 'thymos-condition-detail.dc.html?slug=guillain-barre-syndrome', kind: 'condition' },
  { title: 'Hashimoto’s thyroiditis / autoimmune thyroiditis', url: 'thymos-condition-detail.dc.html?slug=hashimotos-thyroiditis', kind: 'condition' },
  { title: 'Henoch-Schonlein purpura', url: 'thymos-condition-detail.dc.html?slug=henoch-schonlein-purpura', kind: 'condition' },
  { title: 'Hidradenitis suppurativa', url: 'thymos-condition-detail.dc.html?slug=hidradenitis-suppurativa', kind: 'condition' },
  { title: 'Hurst’s disease / acute hemorrhagic leukoencephalitis', url: 'thymos-condition-detail.dc.html?slug=hursts-disease', kind: 'condition' },
  { title: 'Hypogammaglobulinemia', url: 'thymos-condition-detail.dc.html?slug=hypogammaglobulinemia', kind: 'condition' },
  { title: 'IgA nephropathy', url: 'thymos-condition-detail.dc.html?slug=iga-nephropathy', kind: 'condition' },
  { title: 'IgG4-related sclerosing disease', url: 'thymos-condition-detail.dc.html?slug=igg4-related-sclerosing-disease', kind: 'condition' },
  { title: 'Immune thrombocytopenia / autoimmune thrombocytopenia purpura', url: 'thymos-condition-detail.dc.html?slug=immune-thrombocytopenia', kind: 'condition' },
  { title: 'Immune-mediated necrotizing myopathy', url: 'thymos-condition-detail.dc.html?slug=immune-mediated-necrotizing-myopathy', kind: 'condition' },
  { title: 'Inclusion body myositis', url: 'thymos-condition-detail.dc.html?slug=inclusion-body-myositis', kind: 'condition' },
  { title: 'Interstitial Cystitis/Recurrent UTIs', url: 'thymos-condition-detail.dc.html?slug=interstitial-cystitis', kind: 'condition' },
  { title: 'Juvenile idiopathic arthritis / adult-onset Still’s disease', url: 'thymos-condition-detail.dc.html?slug=juvenile-idiopathic-arthritis-stills', kind: 'condition' },
  { title: 'Kawasaki disease', url: 'thymos-condition-detail.dc.html?slug=kawasaki-disease', kind: 'condition' },
  { title: 'Lambert-Eaton myasthenic syndrome', url: 'thymos-condition-detail.dc.html?slug=lambert-eaton-myasthenic-syndrome', kind: 'condition' },
  { title: 'Leukocytoclastic vasculitis', url: 'thymos-condition-detail.dc.html?slug=leukocytoclastic-vasculitis', kind: 'condition' },
  { title: 'Lichen planus', url: 'thymos-condition-detail.dc.html?slug=lichen-planus', kind: 'condition' },
  { title: 'Lichen sclerosus', url: 'thymos-condition-detail.dc.html?slug=lichen-sclerosus', kind: 'condition' },
  { title: 'Linear IgA disease', url: 'thymos-condition-detail.dc.html?slug=linear-igadisease', kind: 'condition' },
  { title: 'Lupus nephritis', url: 'thymos-condition-detail.dc.html?slug=lupus-nephritis', kind: 'condition' },
  { title: 'Lyme disease', url: 'thymos-condition-detail.dc.html?slug=lyme-disease', kind: 'condition' },
  { title: 'Ménière’s disease', url: 'thymos-condition-detail.dc.html?slug=menierers-disease', kind: 'condition' },
  { title: 'Microscopic polyangiitis / ANCA-associated vasculitis', url: 'thymos-condition-detail.dc.html?slug=microscopic-polyangiitis-anca-associated-vasculitis', kind: 'condition' },
  { title: 'Mixed connective tissue disease', url: 'thymos-condition-detail.dc.html?slug=mixed-connective-tissue-disease', kind: 'condition' },
  { title: 'Mucous membrane pemphigoid / ocular cicatricial pemphigoid', url: 'thymos-condition-detail.dc.html?slug=mucous-membrane-pemphigoid', kind: 'condition' },
  { title: 'Multiple sclerosis', url: 'thymos-condition-detail.dc.html?slug=multiple-sclerosis', kind: 'condition' },
  { title: 'Myalgic encephalomyelitis / chronic fatigue syndrome', url: 'thymos-condition-detail.dc.html?slug=me-cfs', kind: 'condition' },
  { title: 'Myasthenia gravis', url: 'thymos-condition-detail.dc.html?slug=myasthenia-gravis', kind: 'condition' },
  { title: 'Narcolepsy', url: 'thymos-condition-detail.dc.html?slug=narcolepsy', kind: 'condition' },
  { title: 'Neuromyelitis optica / Devic’s disease', url: 'thymos-condition-detail.dc.html?slug=neuromyelitis-optica', kind: 'condition' },
  { title: 'Optic Neuritis', url: 'thymos-condition-detail.dc.html?slug=optic-neuritis', kind: 'condition' },
  { title: 'Palindromic rheumatism', url: 'thymos-condition-detail.dc.html?slug=palindromic-rheumatism', kind: 'condition' },
  { title: 'Palmoplantar pustulosis', url: 'thymos-condition-detail.dc.html?slug=palmoplantar-pustulosis', kind: 'condition' },
  { title: 'Paraneoplastic cerebellar degeneration', url: 'thymos-condition-detail.dc.html?slug=paraneoplastic-cerebellar-degeneration', kind: 'condition' },
  { title: 'Paraneoplastic pemphigus', url: 'thymos-condition-detail.dc.html?slug=paraneoplastic-pemphigus', kind: 'condition' },
  { title: 'Paroxysmal nocturnal hemoglobinuria', url: 'thymos-condition-detail.dc.html?slug=paroxysmal-nocturnal-hemoglobinuria', kind: 'condition' },
  { title: 'Parry-Romberg syndrome / hemifacial atrophy / progressive facial hemiatrophy', url: 'thymos-condition-detail.dc.html?slug=parry-romberg-syndrome', kind: 'condition' },
  { title: 'Parsonage-Turner syndrome', url: 'thymos-condition-detail.dc.html?slug=parsonage-turner-syndrome', kind: 'condition' },
  { title: 'Pemphigoid gestationis / herpes gestationis', url: 'thymos-condition-detail.dc.html?slug=pemphigoid-gestationis', kind: 'condition' },
  { title: 'Pemphigus foliaceus', url: 'thymos-condition-detail.dc.html?slug=pemphigus-foliaceus', kind: 'condition' },
  { title: 'Pemphigus vulgaris', url: 'thymos-condition-detail.dc.html?slug=pemphigus-vulgaris', kind: 'condition' },
  { title: 'Pernicious anemia', url: 'thymos-condition-detail.dc.html?slug=pernicious-anemia', kind: 'condition' },
  { title: 'Pityriasis Lichenoides et Varioliformis Acuta (PLEVA) / Mucha-Habermann disease', url: 'thymos-condition-detail.dc.html?slug=pityriasis-lichenoides-et-varioliformis-acuta-pleva', kind: 'condition' },
  { title: 'POEMS syndrome', url: 'thymos-condition-detail.dc.html?slug=poems-syndrome', kind: 'condition' },
  { title: 'Polyarteritis nodosa', url: 'thymos-condition-detail.dc.html?slug=polyarteritis-nodosa', kind: 'condition' },
  { title: 'Polymyalgia rheumatica', url: 'thymos-condition-detail.dc.html?slug=polymyalgia-rheumatica', kind: 'condition' },
  { title: 'Polymyositis', url: 'thymos-condition-detail.dc.html?slug=polymyositis', kind: 'condition' },
  { title: 'Postural orthostatic tachycardia syndrome', url: 'thymos-condition-detail.dc.html?slug=postural-orthostatic-tachycardia-syndrome', kind: 'condition' },
  { title: 'Primary biliary cirrhosis', url: 'thymos-condition-detail.dc.html?slug=primary-biliary-cirrhosis', kind: 'condition' },
  { title: 'Primary sclerosing cholangitis', url: 'thymos-condition-detail.dc.html?slug=primary-sclerosing-cholangitis', kind: 'condition' },
  { title: 'Psoriasis', url: 'thymos-condition-detail.dc.html?slug=psoriasis', kind: 'condition' },
  { title: 'Psoriatic arthritis', url: 'thymos-condition-detail.dc.html?slug=psoriatic-arthritis', kind: 'condition' },
  { title: 'Pure red cell aplasia', url: 'thymos-condition-detail.dc.html?slug=pure-red-cell-aplasia', kind: 'condition' },
  { title: 'Pyoderma gangrenosum', url: 'thymos-condition-detail.dc.html?slug=pyoderma-gangrenosum', kind: 'condition' },
  { title: 'Raynaud’s syndrome', url: 'thymos-condition-detail.dc.html?slug=raynauds-syndrome', kind: 'condition' },
  { title: 'Reactive arthritis', url: 'thymos-condition-detail.dc.html?slug=reactive-arthritis', kind: 'condition' },
  { title: 'Relapsing polychondritis', url: 'thymos-condition-detail.dc.html?slug=relapsing-polychondritis', kind: 'condition' },
  { title: 'Rheumatic fever', url: 'thymos-condition-detail.dc.html?slug=rheumatic-fever', kind: 'condition' },
  { title: 'Rheumatoid arthritis', url: 'thymos-condition-detail.dc.html?slug=rheumatoid-arthritis', kind: 'condition' },
  { title: 'Sarcoidosis', url: 'thymos-condition-detail.dc.html?slug=sarcoidosis', kind: 'condition' },
  { title: 'Schmidt syndrome', url: 'thymos-condition-detail.dc.html?slug=schmidt-syndrome', kind: 'condition' },
  { title: 'Scleritis', url: 'thymos-condition-detail.dc.html?slug=scleritis', kind: 'condition' },
  { title: 'Scleroderma', url: 'thymos-condition-detail.dc.html?slug=scleroderma', kind: 'condition' },
  { title: 'Sjögren’s syndrome', url: 'thymos-condition-detail.dc.html?slug=sjogren-syndrome', kind: 'condition' },
  { title: 'Small fiber sensory neuropathy', url: 'thymos-condition-detail.dc.html?slug=small-fiber-sensory-neuropathy', kind: 'condition' },
  { title: 'Sydenham’s chorea', url: 'thymos-condition-detail.dc.html?slug=sydenhams-chorea', kind: 'condition' },
  { title: 'Systemic lupus erythematosus', url: 'thymos-condition-detail.dc.html?slug=systemic-lupus-erythematosus', kind: 'condition' },
  { title: 'Takayasu arteritis', url: 'thymos-condition-detail.dc.html?slug=takayasu-arteritis', kind: 'condition' },
  { title: 'Testicular autoimmunity / autoimmune orchitis', url: 'thymos-condition-detail.dc.html?slug=testicular-autoimmunity', kind: 'condition' },
  { title: 'Thyroid eye disease / Graves’ ophthalmopathy / thyroid-associated orbitopathy', url: 'thymos-condition-detail.dc.html?slug=thyroid-eye-disease-graves-ophthalmopathy-thyroid-associated-orbitopathy', kind: 'condition' },
  { title: 'Ulcerative colitis', url: 'thymos-condition-detail.dc.html?slug=ulcerative-colitis', kind: 'condition' },
  { title: 'Undifferentiated connective tissue disease', url: 'thymos-condition-detail.dc.html?slug=undifferentiated-connective-tissue-disease', kind: 'condition' },
  { title: 'Vitiligo', url: 'thymos-condition-detail.dc.html?slug=vitiligo', kind: 'condition' },
  { title: 'Adrenal Insufficiency', url: 'thymos-condition-detail.dc.html?slug=adrenal-insufficiency', kind: 'condition' },
  { title: 'Allergy / Asthma', url: 'thymos-condition-detail.dc.html?slug=allergy-asthma', kind: 'condition' },
  { title: 'Diabetes', url: 'thymos-condition-detail.dc.html?slug=diabetes', kind: 'condition' },
  { title: 'Heart Disease and Stroke', url: 'thymos-condition-detail.dc.html?slug=heart-disease-and-stroke', kind: 'condition' },
  { title: 'Hypertension (High Blood Pressure)', url: 'thymos-condition-detail.dc.html?slug=high-blood-pressure', kind: 'condition' },
  { title: 'High Cholesterol (Hyperlipidemia)', url: 'thymos-condition-detail.dc.html?slug=high-cholesterol', kind: 'condition' },
  { title: 'Irritable Bowel Syndrome (IBS)', url: 'thymos-condition-detail.dc.html?slug=irritable-bowel-syndrome-ibs', kind: 'condition' },
  { title: 'Migraines/Headaches', url: 'thymos-condition-detail.dc.html?slug=migraines-headaches', kind: 'condition' },
  { title: 'Osteoporosis', url: 'thymos-condition-detail.dc.html?slug=osteoporosis', kind: 'condition' },
  { title: 'PCOS (Polycystic Ovarian Syndrome)', url: 'thymos-condition-detail.dc.html?slug=pcos-polycystic-ovarian-syndrome', kind: 'condition' },
  { title: 'Thyroid Disorders (Hashimoto\'s)', url: 'thymos-condition-detail.dc.html?slug=thyroid-disorders-hashimoto-s', kind: 'condition' },
  { title: 'Autoimmune hypoparathyroidism', url: 'thymos-condition-detail.dc.html?slug=autoimmune-hypoparathyroidism', kind: 'condition' }
  ];

  var INDEX = PAGES.concat(JOURNEYS).concat(CONDITIONS);

  function normalize(s) {
    return (s || "").toString().trim().toLowerCase();
  }

  function localMatch(query) {
    var q = normalize(query);
    if (!q) return null;

    var best = null;
    var bestScore = 0;

    for (var i = 0; i < INDEX.length; i++) {
      var entry = INDEX[i];
      var title = normalize(entry.title);
      var score = 0;

      if (title === q) {
        score = 100;
      } else if (title.indexOf(q) !== -1) {
        score = 60;
      } else if (q.length > 2 && title.indexOf(q) === -1 && q.indexOf(title) !== -1 && title.length > 2) {
        score = 55;
      }

      if (entry.keywords) {
        for (var k = 0; k < entry.keywords.length; k++) {
          var kw = normalize(entry.keywords[k]);
          if (kw === q) {
            score = Math.max(score, 90);
          } else if (kw.indexOf(q) !== -1 || (q.length > 2 && q.indexOf(kw) !== -1)) {
            score = Math.max(score, 40);
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }

    return bestScore > 0 ? best : null;
  }

  function externalFallbackUrl(query) {
    return "https://www.google.com/search?q=" + encodeURIComponent("site:thymoshealth.com " + query);
  }

  // Called from each page's footer search form. Returns either
  // { type: "local", url, title } for an on-site match, or
  // { type: "external", url } to send the visitor to a domain-scoped web
  // search when nothing on the site matches closely enough.
  window.thymosSiteSearch = function (query) {
    var match = localMatch(query);
    if (match) {
      return { type: "local", url: match.url, title: match.title };
    }
    return { type: "external", url: externalFallbackUrl(query) };
  };
})();
