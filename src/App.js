import React, { useState } from 'react';
import './App.css';
import { initialData } from './initialData';

function App() {
  const [data, setData] = useState(initialData);

  // --- CONFIGURATION CARTES ---
  const cardCategories = {
    "Support": [
      "ExecutionersAxe", "CrushingVoid", "MentalFocus", "ImpactAttack",
      "InnerTruth", "FinisherAttack", "SuperheatMetal", "BurstBoost",
      "LimbSupport", "TotemFairySkill", "TeamTactics", "SpinalTap",
      "AstralEcho", "TriangleSupport"
    ],
    "Affliction": [
      "BurningAttack", "PoisonAttack", "DecayingAttack", "Fuse",
      "Shadow", "PlagueAttack", "Disease", "Swarm",
      "RuinousRust", "PowerBubble", "RuneAttack", "MagicPotion",
      "SandsOfTime", "CosmicBarb"
    ],
    "Burst": [
      "MoonBeam", "Fragmentize", "SkullBash", "RazorWind",
      "WhipOfLightning", "BurstCount", "Purify", "LimbBurst",
      "FlakShot", "Haymaker", "ChainLightning", "MirrorForce",
      "CelestialStatic", "Weaken"
    ]
  };

  // --- UTILITAIRES ---
  const getCardImage = (cardName) => {
    try { return require(`./assets/${cardName}.png`); } catch (err) { return null; }
  };

  const toNormalNumber = (val) => {
    if (val === "" || val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    const strVal = String(val);
    if (strVal.toLowerCase().includes('e')) {
      const num = parseFloat(strVal);
      return isNaN(num) ? 0 : num;
    }
    return val;
  };

  const getReadableLabel = (key) => {
    const bossMap = { "1": "Lojak", "2": "Takedar", "3": "Jukk", "4": "Sterl", "5": "Mohaca", "6": "Terro", "7": "Klonk", "8": "Priker" };
    let label = key;

    const bossMatch = label.match(/(?:Raid)?Enemy(\d+)/i);
    if (bossMatch && bossMap[bossMatch[1]]) label = label.replace(bossMatch[0], bossMap[bossMatch[1]]);

    label = label.replace(/([A-Z])/g, ' $1').trim();

    const replacements = {
      "Affliction Base Damage": "Affli Dmg", "Burst Base Damage": "Burst Dmg", "Base Damage": "Dmg",
      "Raid Base": "Base Raid", "Damage": "Dmg", "Affliction": "Affli",
      "Armor": "Armor", "Body": "Body", "Head": "Head", "Limb": "Limb", "Torso": "Torso", "Chest": "Torso"
    };

    Object.keys(replacements).forEach(term => {
      const regex = new RegExp(term, "gi");
      label = label.replace(regex, replacements[term]);
    });
    return label.replace(/\s+/g, ' ').trim();
  };

  // LISTE D'EXCLUSION
  const excludedRaidStats = [
    "Raid Cards Owned", "Wildcards", "Lifetime Clan Morale",
    "Solo Raid World Reached", "Total Raid Experience", "Total Raid Attacks",
    "Raid Level",
    "Raid Level Base Dmg",
    "Raid Level Base Damage",
    "Total Raid Card Levels"
  ];

  // --- HANDLERS ---
  const handleStatChange = (category, key, value) => {
    setData(prev => ({ ...prev, [category]: { ...prev[category], [key]: value } }));
  };
  const handleCardChange = (cardName, value) => {
    const cleanValue = value === "" ? 0 : parseInt(value);
    setData(prev => ({ ...prev, raidCards: { ...prev.raidCards, [cardName]: { ...prev.raidCards[cardName], lv: cleanValue } } }));
  };
  const handleResearchChange = (category, key, value) => {
    setData(prev => ({ ...prev, [category]: { ...prev[category], [key]: value } }));
  };
  const handlePercentageChange = (category, key, displayValue) => {
    const decimalValue = parseFloat(displayValue) / 100;
    setData(prev => ({ ...prev, [category]: { ...prev[category], [key]: isNaN(decimalValue) ? 0 : decimalValue } }));
  };

  // --- EXPORT & CALCULS ---
  const copyToClipboard = () => {
    const exportData = JSON.parse(JSON.stringify(data));

    // 1. CALCUL : TOTAL RAID CARD LEVELS
    let totalCardLevels = 0;
    Object.values(exportData.raidCards).forEach(card => {
      totalCardLevels += (parseInt(card.lv) || 0);
    });
    exportData.raidStats["Total Raid Card Levels"] = totalCardLevels;

    // 2. CALCUL : RAID LEVEL BASE DAMAGE (Sans doublon)
    const currentRaidLevel = parseFloat(exportData.raidStats["Raid Level"]) || 0;
    const calculatedBaseDmg = currentRaidLevel + 100;

    let targetKey = "Raid Level Base Damage";
    const existingKeys = Object.keys(exportData.raidStats);
    const foundKey = existingKeys.find(k => k.trim() === "Raid Level Base Damage" || k === "Raid Level Base Dmg");

    if (foundKey) {
      targetKey = foundKey;
    }

    exportData.raidStats[targetKey] = calculatedBaseDmg;

    // 3. Conversion Scientifique
    const scientificCategories = ['raid_card_research', 'gemstonesResearch', 'titanResearch'];
    const toScientific = (val) => {
      const num = Number(val);
      if (isNaN(num) || num === 0) return "0.000E+0";
      return num.toExponential(3).toUpperCase();
    };
    scientificCategories.forEach(cat => {
      Object.keys(exportData[cat]).forEach(key => { exportData[cat][key] = toScientific(exportData[cat][key]); });
    });

    const jsonString = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => alert("Copié !")).catch(console.error);
  };

  // --- RENDU SECTIONS ---
  const renderDetailedSection = (categoryKey) => {
    const statsData = data[categoryKey];
    const keys = Object.keys(statsData);
    const buckets = { "Base": [], "Armor": [], "Body": [], "Titans": [], "Burst": [], "Affliction": [] };

    keys.forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('burst')) buckets["Burst"].push(key);
      else if (lowerKey.includes('affli') || lowerKey.includes('affliction')) buckets["Affliction"].push(key);
      else if (lowerKey.includes('armor')) buckets["Armor"].push(key);
      else if (lowerKey.includes('body')) buckets["Body"].push(key);
      else if (lowerKey.includes('enemy')) buckets["Titans"].push(key);
      else buckets["Base"].push(key);
    });

    return Object.entries(buckets).map(([bucketName, bucketKeys]) => {
      if (bucketKeys.length === 0) return null;
      return (
        <div key={bucketName} className="category-block">
          <h3 className="category-title">{bucketName}</h3>
          <div className="stats-grid">
            {bucketKeys.map(key => (
              <div key={key} className="input-group">
                <label>{getReadableLabel(key)}</label>
                <input type="number" step="0.01" value={toNormalNumber(statsData[key])} onChange={(e) => handleResearchChange(categoryKey, key, e.target.value)} onFocus={(e) => e.target.select()} />
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  const renderTitanSection = (categoryKey) => {
    const statsData = data[categoryKey];
    const keys = Object.keys(statsData);
    const buckets = { "Base": [], "Titans": [] };

    keys.forEach(key => {
      if (key.toLowerCase().includes('enemy')) buckets["Titans"].push(key);
      else buckets["Base"].push(key);
    });

    return Object.entries(buckets).map(([bucketName, bucketKeys]) => {
      if (bucketKeys.length === 0) return null;
      return (
        <div key={bucketName} className="category-block">
          <h3 className="category-title">{bucketName}</h3>
          <div className="stats-grid">
            {bucketKeys.map(key => {
              const rawVal = parseFloat(statsData[key]);
              const val = isNaN(rawVal) ? 0 : parseFloat((rawVal * 100).toFixed(1));
              return (
                <div key={key} className="input-group">
                  <label>{getReadableLabel(key)}</label>
                  <input type="number" step="0.1" value={val} onChange={(e) => handlePercentageChange(categoryKey, key, e.target.value)} onFocus={(e) => e.target.select()} />
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="app-container">
      <h1>Configurateur RO Clan</h1>

      {/* 1. Player Stats */}
      <section>
        <h2>Player Stats</h2>
        <div className="stats-grid" style={{ justifyContent: 'center' }}>

          {/* RAID LEVEL */}
          <div className="input-group">
            <label>Raid Level</label>
            <input
              type="number"
              value={toNormalNumber(data.raidStats["Raid Level"])}
              onChange={(e) => handleStatChange("raidStats", "Raid Level", e.target.value)}
            />
          </div>

          {/* NECROBEAR */}
          <div className="input-group">
            <label>Necrobear Level</label>
            <input
              type="number"
              value={toNormalNumber(data.playerStats["Necrobear Level"])}
              onChange={(e) => handleStatChange("playerStats", "Necrobear Level", e.target.value)}
            />
          </div>

        </div>
      </section>

      {/* 2. Raid Cards */}
      <section>
        <h2>Raid Cards (Niveaux)</h2>
        {Object.entries(cardCategories).map(([categoryName, cardsList]) => (
          <div key={categoryName} className="category-block">
            <h3 className="category-title">{categoryName}</h3>
            <div className="cards-grid">
              {cardsList.map(cardName => {
                if (!data.raidCards[cardName]) return null;
                const imageSrc = getCardImage(cardName);
                return (
                  <div key={cardName} className="card-item">
                    {imageSrc ? (
                      <img src={imageSrc} alt={cardName} title={cardName} className="card-img" />
                    ) : (
                      <label className="missing-img-label">{cardName}</label>
                    )}
                    <input
                      type="number"
                      value={toNormalNumber(data.raidCards[cardName].lv)}
                      onChange={(e) => handleCardChange(cardName, e.target.value)}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* 3. Raid Card Research */}
      <section>
        <h2>Raid Card Research</h2>
        {renderDetailedSection("raid_card_research")}
      </section>

      {/* 4. Gemstones Research */}
      <section>
        <h2>Gemstones Research</h2>
        {renderDetailedSection("gemstonesResearch")}
      </section>

      {/* 5. Titan Research */}
      <section>
        <h2>Titan Research (%)</h2>
        {renderTitanSection("titanResearch")}
      </section>

      <div className="sticky-footer">
        <button className="copy-btn" onClick={copyToClipboard}>
          Copier la config
        </button>
      </div>
    </div>
  );
}

export default App;