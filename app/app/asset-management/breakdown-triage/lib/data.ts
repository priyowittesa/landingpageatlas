// Mock data for the Breakdown Triage prototype (from atlas-breakdown-triage.html).
// Replace with API data once the triage service is available.
import type {
  TriageAsset,
  AssetHealth,
  BreakdownReport,
  WorkOrderHistory,
  SynonymEntry,
  AiInsight,
  ScoringVersion,
  OverrideRecord,
} from "./types";

/** "Now" for the mock dataset, in minutes since the start of the shift (15:18). */
export const NOW_MINUTES = 918;

export const TECHNICIANS = ["Rudi H.","Dedi K.","Agus P.","Bayu S."];

export const ASSETS: Record<string, TriageAsset> = {
  "CMP-L2-01": {
    "name": "Line 2 Air Compressor",
    "type": "75 kW screw compressor",
    "location": "Plant 1 · Line 2",
    "line": "Line 2",
    "criticality": "A",
    "bottleneck": true,
    "statutory": false,
    "source": "ai",
    "confidence": 0.86,
    "llm": {
      "criticality": "A",
      "bottleneck": true
    },
    "reason": "Only compressed-air supply for Line 2; 6 breakdowns in 12 months",
    "inputs": "75 kW screw compressor · 1 of 1 compressor on Line 2 · 6 breakdown WOs/12 mo",
    "assetClass": "Compressor"
  },
  "BLR-UT-01": {
    "name": "Utility Boiler 1",
    "type": "Fire-tube boiler 5 t/h",
    "location": "Utility Area",
    "line": "Utilities",
    "criticality": "A",
    "bottleneck": false,
    "statutory": true,
    "source": "fabrix",
    "confidence": null,
    "reason": "Criticality recorded in Fabrix asset master",
    "assetClass": "Boiler"
  },
  "HYD-PR-05": {
    "name": "Hydraulic Press 05",
    "type": "200 T hydraulic press",
    "location": "Plant 1 · Stamping",
    "line": "Stamping",
    "criticality": "A",
    "bottleneck": false,
    "statutory": false,
    "source": "ai",
    "confidence": 0.74,
    "llm": {
      "criticality": "A",
      "bottleneck": false
    },
    "reason": "Only 200 T press for bracket parts; a 150 T backup press is available",
    "inputs": "1 × 200 T press + 1 × 150 T backup · 5 breakdown WOs/12 mo",
    "assetClass": "Press"
  },
  "CNV-L1-03": {
    "name": "Belt Conveyor L1-03",
    "type": "Belt conveyor",
    "location": "Plant 1 · Line 1",
    "line": "Line 1",
    "criticality": "B",
    "bottleneck": true,
    "statutory": false,
    "source": "ai",
    "confidence": 0.66,
    "llm": {
      "criticality": "B",
      "bottleneck": true
    },
    "reason": "Single path between Line 1 stations, but has a 20-minute buffer",
    "inputs": "Single path on Line 1 · 20 min buffer · 7 breakdown WOs/12 mo",
    "assetClass": "Conveyor"
  },
  "PMP-WT-02": {
    "name": "Water Transfer Pump 02",
    "type": "Centrifugal pump",
    "location": "Water Treatment",
    "line": "WTP",
    "criticality": "B",
    "bottleneck": false,
    "statutory": false,
    "source": "manual",
    "confidence": 0.71,
    "llm": {
      "criticality": "A",
      "bottleneck": true
    },
    "reason": "Single pump for process water transfer",
    "inputs": "WTP location · 7 months of history · 2 breakdown WOs",
    "audit": [
      {
        "by": "Siti W.",
        "at": "28 Oct 2026, 10:14",
        "reason": "Backup pump 01 is available at full capacity"
      }
    ],
    "assetClass": "Pump"
  },
  "EXF-L3-04": {
    "name": "Exhaust Fan L3-04",
    "type": "0.75 kW exhaust fan",
    "location": "Plant 2 · Line 3",
    "line": "Line 3",
    "criticality": "C",
    "bottleneck": false,
    "statutory": false,
    "source": "ai",
    "confidence": 0.91,
    "llm": {
      "criticality": "C",
      "bottleneck": false
    },
    "reason": "Area ventilation; 5 other fans in the same zone",
    "inputs": "6 fans in the Line 3 zone · 0 breakdown WOs/12 mo",
    "assetClass": "Exhaust fan"
  },
  "IMM-L4-02": {
    "name": "Injection Molder L4-02",
    "type": "350 T injection molding",
    "location": "Plant 2 · Line 4",
    "line": "Line 4",
    "criticality": "A",
    "bottleneck": true,
    "statutory": false,
    "source": "ai",
    "confidence": 0.88,
    "llm": {
      "criticality": "A",
      "bottleneck": true
    },
    "reason": "Only 350 T machine for housings; 92% utilization",
    "inputs": "1 of 1 × 350 T machine · 92% utilization · 4 breakdown WOs/12 mo",
    "assetClass": "Injection molder"
  },
  "TRF-MN-01": {
    "name": "Main Transformer 1",
    "type": "2 MVA transformer",
    "location": "Substation",
    "line": "Utilities",
    "criticality": "A",
    "bottleneck": true,
    "statutory": true,
    "source": "fabrix",
    "confidence": null,
    "reason": "Criticality recorded in Fabrix asset master",
    "assetClass": "Transformer"
  },
  "CRN-OH-02": {
    "name": "Overhead Crane 02",
    "type": "10 T crane",
    "location": "Plant 1 · Warehouse",
    "line": "Warehouse",
    "criticality": "B",
    "bottleneck": false,
    "statutory": true,
    "source": "ai",
    "confidence": 0.63,
    "llm": {
      "criticality": "B",
      "bottleneck": false
    },
    "reason": "Used to unload coils; forklift available as an alternative",
    "inputs": "Warehouse area · forklift alternative · 3 breakdown WOs/12 mo",
    "assetClass": "Crane"
  },
  "CHL-UT-01": {
    "name": "Utility Chiller 1",
    "type": "120 TR chiller",
    "location": "Utility Area",
    "line": "Utilities",
    "criticality": "B",
    "bottleneck": false,
    "statutory": false,
    "source": "ai",
    "confidence": 0.58,
    "llm": {
      "criticality": "B",
      "bottleneck": false
    },
    "reason": "Cools Line 4 molds; chiller 02 covers 60% of capacity",
    "inputs": "Serves Line 4 · backup chiller at 60% · 9 months of history",
    "assetClass": "Chiller"
  },
  "PMP-WT-01": {
    "name": "Water Transfer Pump 01",
    "type": "Centrifugal pump",
    "location": "Water Treatment",
    "line": "WTP",
    "criticality": "B",
    "bottleneck": false,
    "statutory": false,
    "source": "fabrix",
    "confidence": null,
    "reason": "Criticality recorded in Fabrix asset master",
    "assetClass": "Pump"
  },
  "PMP-CL-03": {
    "name": "Cooling Water Pump 03",
    "type": "Centrifugal pump",
    "location": "Utility Area",
    "line": "Utilities",
    "criticality": "B",
    "bottleneck": false,
    "statutory": false,
    "source": "fabrix",
    "confidence": null,
    "reason": "Criticality recorded in Fabrix asset master",
    "assetClass": "Pump"
  },
  "CMP-L1-01": {
    "name": "Line 1 Air Compressor",
    "type": "55 kW screw compressor",
    "location": "Plant 1 · Line 1",
    "line": "Line 1",
    "criticality": "A",
    "bottleneck": true,
    "statutory": false,
    "source": "ai",
    "confidence": 0.84,
    "llm": {
      "criticality": "A",
      "bottleneck": true
    },
    "reason": "Main compressed-air supply for Line 1",
    "inputs": "New asset (Aug 2026) · no WOs yet",
    "assetClass": "Compressor"
  }
};

export const ASSET_HEALTH: Record<string, AssetHealth | null> = {
  "CMP-L2-01": {
    "breakdowns": 6,
    "typeMedian": 3,
    "mttrHours": 3.1,
    "mtbfHours": 612,
    "mtbfMethod": "operating_hours",
    "failureCodes": [
      {
        "code": "BRG-WEAR",
        "label": "Worn bearing",
        "count": 3
      },
      {
        "code": "FLT-CLOG",
        "label": "Clogged filter",
        "count": 2
      },
      {
        "code": "VLV-UNL",
        "label": "Unloader valve failure",
        "count": 1
      }
    ],
    "repeat": true,
    "lastBreakdown": "12 Oct 2026",
    "months": 12
  },
  "CMP-L1-01": null,
  "BLR-UT-01": {
    "breakdowns": 2,
    "typeMedian": 2,
    "mttrHours": 1.8,
    "mtbfHours": 3480,
    "mtbfMethod": "interval",
    "failureCodes": [
      {
        "code": "AFR-ADJ",
        "label": "Air–fuel ratio out of range",
        "count": 1
      },
      {
        "code": "NZL-CLOG",
        "label": "Clogged nozzle",
        "count": 1
      }
    ],
    "repeat": false,
    "lastBreakdown": "03 Sep 2026",
    "months": 12
  },
  "HYD-PR-05": {
    "breakdowns": 5,
    "typeMedian": 3,
    "mttrHours": 4.2,
    "mtbfHours": 840,
    "mtbfMethod": "operating_hours",
    "failureCodes": [
      {
        "code": "SEAL-LEAK",
        "label": "Seal leak",
        "count": 4
      },
      {
        "code": "FIT-LEAK",
        "label": "Fitting leak",
        "count": 1
      }
    ],
    "repeat": false,
    "lastBreakdown": "28 Sep 2026",
    "months": 12
  },
  "CNV-L1-03": {
    "breakdowns": 7,
    "typeMedian": 4,
    "mttrHours": 1.1,
    "mtbfHours": 410,
    "mtbfMethod": "operating_hours",
    "failureCodes": [
      {
        "code": "BLT-TEN",
        "label": "Belt tension",
        "count": 3
      },
      {
        "code": "SPL-MAT",
        "label": "Material spillage",
        "count": 2
      },
      {
        "code": "LAG-WEAR",
        "label": "Worn pulley lagging",
        "count": 2
      }
    ],
    "repeat": false,
    "lastBreakdown": "08 Oct 2026",
    "months": 12
  },
  "PMP-WT-01": {
    "breakdowns": 2,
    "typeMedian": 1,
    "mttrHours": 2,
    "mtbfHours": 3312,
    "mtbfMethod": "interval",
    "failureCodes": [
      {
        "code": "MIS-ALN",
        "label": "Coupling misalignment",
        "count": 1
      },
      {
        "code": "IMP-WEAR",
        "label": "Worn impeller",
        "count": 1
      }
    ],
    "repeat": false,
    "lastBreakdown": "17 Sep 2026",
    "months": 12
  },
  "PMP-WT-02": {
    "breakdowns": 2,
    "typeMedian": 1,
    "mttrHours": 2.2,
    "mtbfHours": 2496,
    "mtbfMethod": "interval",
    "failureCodes": [
      {
        "code": "IMP-WEAR",
        "label": "Worn impeller",
        "count": 1
      },
      {
        "code": "CAV",
        "label": "Cavitation",
        "count": 1
      }
    ],
    "repeat": false,
    "lastBreakdown": "09 Sep 2026",
    "months": 7
  },
  "PMP-CL-03": {
    "breakdowns": 1,
    "typeMedian": 1,
    "mttrHours": 1.5,
    "mtbfHours": null,
    "mtbfMethod": "interval",
    "failureCodes": [
      {
        "code": "CAV",
        "label": "Cavitation",
        "count": 1
      }
    ],
    "repeat": false,
    "lastBreakdown": "09 Jul 2026",
    "months": 12
  },
  "EXF-L3-04": {
    "breakdowns": 0,
    "typeMedian": 1,
    "mttrHours": null,
    "mtbfHours": null,
    "mtbfMethod": "interval",
    "failureCodes": [],
    "repeat": false,
    "lastBreakdown": "—",
    "months": 12
  },
  "IMM-L4-02": {
    "breakdowns": 4,
    "typeMedian": 2,
    "mttrHours": 1.4,
    "mtbfHours": 980,
    "mtbfMethod": "operating_hours",
    "failureCodes": [
      {
        "code": "HTR-OPEN",
        "label": "Heater open circuit",
        "count": 2
      },
      {
        "code": "TRM-LOOSE",
        "label": "Loose terminal",
        "count": 1
      },
      {
        "code": "TC-FAIL",
        "label": "Thermocouple failure",
        "count": 1
      }
    ],
    "repeat": false,
    "lastBreakdown": "22 Sep 2026",
    "months": 12
  },
  "TRF-MN-01": {
    "breakdowns": 0,
    "typeMedian": 0,
    "mttrHours": null,
    "mtbfHours": null,
    "mtbfMethod": "interval",
    "failureCodes": [],
    "repeat": false,
    "lastBreakdown": "—",
    "months": 12
  },
  "CRN-OH-02": {
    "breakdowns": 4,
    "typeMedian": 2,
    "mttrHours": 0.7,
    "mtbfHours": 1560,
    "mtbfMethod": "interval",
    "failureCodes": [
      {
        "code": "IND-LMP",
        "label": "Indicator lamp",
        "count": 3
      },
      {
        "code": "LMT-SW",
        "label": "Limit switch",
        "count": 1
      }
    ],
    "repeat": true,
    "lastBreakdown": "01 Nov 2026",
    "months": 12
  },
  "CHL-UT-01": {
    "breakdowns": 3,
    "typeMedian": 2,
    "mttrHours": 5.5,
    "mtbfHours": 1968,
    "mtbfMethod": "interval",
    "failureCodes": [
      {
        "code": "REF-LOW",
        "label": "Low refrigerant",
        "count": 2
      },
      {
        "code": "FAN-COND",
        "label": "Condenser fan failure",
        "count": 1
      }
    ],
    "repeat": false,
    "lastBreakdown": "01 Nov 2026",
    "months": 9
  }
};

export const REPORTS: BreakdownReport[] = [
  {
    "id": "BR-2026-1102-014",
    "workOrder": "WO-10458",
    "assetId": "CMP-L2-01",
    "description": "Line 2 compressor making loud noise and pressure dropping",
    "tags": [
      "loud noise",
      "pressure drop"
    ],
    "machineStatus": "stopped",
    "safetyFlag": false,
    "history": "repeat",
    "historyText": "Repeat breakdown 2× in 30 days",
    "reporter": "Andi S. · Line 2 Operator",
    "receivedAt": "15:12",
    "minutesAgo": 6,
    "state": "new",
    "technician": "Rudi H.",
    "cause": "Worn bearing",
    "causeConfidence": "High",
    "inferred": false,
    "evidence": "2 of 3 similar cases (WO-10231, WO-09877)",
    "estimatedHours": 3,
    "latencyMs": 1840,
    "fallback": null,
    "actions": [
      "Isolate and lock out the compressor per SOP-LOTO-02",
      "Check vibration and temperature of the motor-side bearing",
      "If temperature > 80°C or vibration is high, replace bearing BRG-6310",
      "Check coupling alignment after replacement",
      "Pressure-test to 7 bar before handing back to the operator"
    ],
    "spares": [
      {
        "id": "BRG-6310",
        "name": "Bearing 6310-2RS",
        "qty": 2,
        "min": 1,
        "leadDays": 7,
        "location": "Warehouse A · Rack 3"
      },
      {
        "id": "SEAL-CMP-22",
        "name": "Compressor seal kit",
        "qty": 1,
        "min": 2,
        "leadDays": 10,
        "location": "Warehouse A · Rack 5"
      },
      {
        "id": "GRS-LGHP2",
        "name": "High-temp bearing grease",
        "qty": 6,
        "min": 2,
        "leadDays": 3,
        "location": "Warehouse A · Rack 1"
      }
    ],
    "similarCases": [
      {
        "workOrder": "WO-10231",
        "similarity": 0.78,
        "date": "12 Oct 2026",
        "assetId": "CMP-L2-01",
        "code": "BRG-WEAR",
        "action": "Replaced motor-side bearing",
        "hours": 3,
        "technician": "Rudi H."
      },
      {
        "workOrder": "WO-09877",
        "similarity": 0.64,
        "date": "24 Sep 2026",
        "assetId": "CMP-L2-01",
        "code": "BRG-WEAR",
        "action": "Replaced bearing + coupling alignment",
        "hours": 3.5,
        "technician": "Dedi K."
      },
      {
        "workOrder": "WO-08712",
        "similarity": 0.41,
        "date": "19 May 2026",
        "assetId": "CMP-L2-01",
        "code": "FLT-CLOG",
        "action": "Cleaned intake filter, checked unloader valve",
        "hours": 1.5,
        "technician": "Rudi H."
      }
    ],
    "documents": [
      {
        "id": "MAN-CMP-07",
        "type": "Manual",
        "title": "Compressor manual – Ch. 6 Bearings",
        "pages": "pp. 42–45",
        "snippet": "Motor-side bearing replacement, housing bolt torque, and initial grease quantity."
      },
      {
        "id": "SOP-LOTO-02",
        "type": "SOP",
        "title": "Compressor Lock-out Tag-out SOP",
        "pages": "pp. 1–3",
        "snippet": "Electrical isolation points and residual pressure release before opening the casing."
      }
    ],
    "notes": [
      {
        "id": 1,
        "by": "Rudi H.",
        "at": "15:14",
        "text": "Checking bearing temperature first. I have requested BRG-6310 from the warehouse."
      }
    ],
    "log": []
  },
  {
    "id": "BR-2026-1102-012",
    "workOrder": "WO-10455",
    "assetId": "BLR-UT-01",
    "description": "Smoke coming from the boiler burner panel, unstable flame",
    "tags": [
      "smoke",
      "unstable flame"
    ],
    "machineStatus": "stopped",
    "safetyFlag": false,
    "history": "normal",
    "reporter": "Yusuf A. · Boiler Operator",
    "receivedAt": "14:58",
    "minutesAgo": 20,
    "state": "in_progress",
    "responseMinutes": 4,
    "technician": "Dedi K.",
    "cause": "Clogged burner nozzle",
    "causeConfidence": "Medium",
    "inferred": true,
    "evidence": "1 of 2 similar cases (WO-09931)",
    "estimatedHours": 2,
    "latencyMs": 1620,
    "fallback": null,
    "actions": [
      "Shut down the burner and close the fuel valve per SOP-BLR-01",
      "Clear a 5 m area and stage a CO₂ extinguisher",
      "Once cool, inspect the nozzle and ignition electrodes",
      "Check fuel pressure and air–fuel ratio settings",
      "Run a staged ignition test with a certified boiler operator present"
    ],
    "spares": [
      {
        "id": "NZL-BRN-3",
        "name": "Burner nozzle 3 GPH",
        "qty": 0,
        "min": 1,
        "leadDays": 14,
        "location": "Warehouse B · Rack 2"
      },
      {
        "id": "ELC-IGN-2",
        "name": "Ignition electrode",
        "qty": 3,
        "min": 2,
        "leadDays": 7,
        "location": "Warehouse B · Rack 2"
      },
      {
        "id": "GSK-BRN",
        "name": "Burner gasket",
        "qty": 2,
        "min": 2,
        "leadDays": 5,
        "location": "Warehouse B · Rack 4"
      }
    ],
    "similarCases": [
      {
        "workOrder": "WO-09931",
        "similarity": 0.66,
        "date": "03 Sep 2026",
        "assetId": "BLR-UT-01",
        "code": "NZL-CLOG",
        "action": "Cleaned and replaced burner nozzle",
        "hours": 2,
        "technician": "Dedi K."
      },
      {
        "workOrder": "WO-08450",
        "similarity": 0.42,
        "date": "11 Apr 2026",
        "assetId": "BLR-UT-01",
        "code": "AFR-ADJ",
        "action": "Re-tuned air–fuel ratio",
        "hours": 1.5,
        "technician": "Agus P."
      }
    ],
    "documents": [
      {
        "id": "SOP-BLR-01",
        "type": "SOP",
        "title": "Boiler Emergency Shutdown SOP",
        "pages": "pp. 1–2",
        "snippet": "Burner shutdown sequence, fuel isolation, and safe distance from the combustion chamber."
      },
      {
        "id": "MAN-BLR-03",
        "type": "Manual",
        "title": "Burner manual – Ch. 4 Ignition",
        "pages": "pp. 21–24",
        "snippet": "Nozzle inspection, electrode gap, and signs of incomplete combustion."
      }
    ],
    "notes": [],
    "log": []
  },
  {
    "id": "BR-2026-1102-009",
    "workOrder": "WO-10449",
    "assetId": "HYD-PR-05",
    "description": "Oil seeping from press cylinder, machine still running",
    "tags": [
      "oil leak"
    ],
    "machineStatus": "running",
    "safetyFlag": false,
    "history": "above",
    "reporter": "Lina M. · Stamping Operator",
    "receivedAt": "14:40",
    "minutesAgo": 38,
    "state": "new",
    "technician": "Rudi H.",
    "cause": "Worn main cylinder seal",
    "causeConfidence": "High",
    "inferred": false,
    "evidence": "3 of 3 similar cases",
    "estimatedHours": 4.5,
    "latencyMs": 1910,
    "fallback": null,
    "actions": [
      "Lower the ram to bottom position and lock out the hydraulic pump",
      "Clean up the leak and place an oil drip tray",
      "Inspect the cylinder rod for scoring",
      "Replace the main cylinder seal kit",
      "Check hydraulic oil level and contamination"
    ],
    "spares": [
      {
        "id": "SEAL-HYD-200",
        "name": "200 T cylinder seal kit",
        "qty": 1,
        "min": 2,
        "leadDays": 21,
        "location": "Warehouse A · Rack 7"
      },
      {
        "id": "OIL-HYD-46",
        "name": "Hydraulic oil ISO VG 46 (drum)",
        "qty": 3,
        "min": 1,
        "leadDays": 4,
        "location": "Oil Store"
      }
    ],
    "similarCases": [
      {
        "workOrder": "WO-10102",
        "similarity": 0.74,
        "date": "28 Sep 2026",
        "assetId": "HYD-PR-05",
        "code": "SEAL-LEAK",
        "action": "Replaced main cylinder seal kit",
        "hours": 4.5,
        "technician": "Agus P."
      },
      {
        "workOrder": "WO-09511",
        "similarity": 0.69,
        "date": "02 Jul 2026",
        "assetId": "HYD-PR-05",
        "code": "SEAL-LEAK",
        "action": "Replaced seal + polished rod",
        "hours": 5,
        "technician": "Rudi H."
      },
      {
        "workOrder": "WO-08876",
        "similarity": 0.52,
        "date": "15 May 2026",
        "assetId": "HYD-PR-05",
        "code": "FIT-LEAK",
        "action": "Replaced seal and fitting O-ring",
        "hours": 3,
        "technician": "Agus P."
      }
    ],
    "documents": [
      {
        "id": "MAN-HYD-02",
        "type": "Manual",
        "title": "Press manual – Ch. 8 Cylinder",
        "pages": "pp. 66–71",
        "snippet": "Main cylinder disassembly and seal installation sequence."
      },
      {
        "id": "SOP-HYD-01",
        "type": "SOP",
        "title": "Hydraulic Energy Isolation SOP",
        "pages": "pp. 1–2",
        "snippet": "Accumulator pressure release and securing the ram."
      }
    ],
    "notes": [],
    "log": []
  },
  {
    "id": "BR-2026-1102-006",
    "workOrder": "WO-10441",
    "assetId": "CNV-L1-03",
    "description": "Conveyor belt slipping, running slow",
    "tags": [
      "belt slip",
      "slow speed"
    ],
    "machineStatus": "running",
    "safetyFlag": false,
    "history": "above",
    "reporter": "Bayu R. · Line 1 Operator",
    "receivedAt": "14:03",
    "minutesAgo": 75,
    "state": "in_progress",
    "responseMinutes": 12,
    "technician": "Rudi H.",
    "cause": "Insufficient belt tension",
    "causeConfidence": "Medium",
    "inferred": false,
    "evidence": "2 of 3 similar cases",
    "estimatedHours": 1,
    "latencyMs": 1490,
    "fallback": null,
    "actions": [
      "Wait for the shift break, then lock out the conveyor motor",
      "Measure belt tension and pulley lagging condition",
      "Adjust the take-up to standard tension",
      "Replace lagging if the surface is glazed"
    ],
    "spares": [
      {
        "id": "LAG-PUL-500",
        "name": "Pulley lagging 500 mm",
        "qty": 2,
        "min": 1,
        "leadDays": 10,
        "location": "Warehouse A · Rack 9"
      }
    ],
    "similarCases": [
      {
        "workOrder": "WO-10311",
        "similarity": 0.69,
        "date": "08 Oct 2026",
        "assetId": "CNV-L1-03",
        "code": "BLT-TEN",
        "action": "Adjusted belt take-up",
        "hours": 0.8,
        "technician": "Bayu S."
      },
      {
        "workOrder": "WO-09720",
        "similarity": 0.55,
        "date": "14 Aug 2026",
        "assetId": "CNV-L1-03",
        "code": "LAG-WEAR",
        "action": "Replaced drive pulley lagging",
        "hours": 2.5,
        "technician": "Rudi H."
      },
      {
        "workOrder": "WO-09012",
        "similarity": 0.33,
        "date": "21 Jun 2026",
        "assetId": "CNV-L1-03",
        "code": "SPL-MAT",
        "action": "Cleared material under the belt",
        "hours": 0.5,
        "technician": "Bayu S."
      }
    ],
    "documents": [
      {
        "id": "MAN-CNV-01",
        "type": "Manual",
        "title": "Conveyor manual – Take-up adjustment",
        "pages": "pp. 12–14",
        "snippet": "Standard tension values and how to measure belt deflection."
      }
    ],
    "notes": [],
    "log": []
  },
  {
    "id": "BR-2026-1102-004",
    "workOrder": "WO-10437",
    "assetId": "PMP-WT-02",
    "description": "Excessive vibration on water transfer pump",
    "tags": [
      "vibration"
    ],
    "machineStatus": "running",
    "safetyFlag": false,
    "history": "above",
    "reporter": "Hendra W. · WTP Operator",
    "receivedAt": "12:10",
    "minutesAgo": 188,
    "state": "scheduled",
    "scheduledFor": "Tomorrow 08:00",
    "technician": "Agus P.",
    "cause": "Impeller imbalance / cavitation",
    "causeConfidence": "Medium",
    "inferred": true,
    "evidence": "2 of 3 cases on the same asset type",
    "estimatedHours": 2.5,
    "latencyMs": 2210,
    "fallback": "asset_type",
    "actions": [
      "Check suction pressure and tank level (cavitation sign)",
      "Measure vibration at the pump bearings",
      "Check motor–pump coupling alignment",
      "If the impeller is damaged, replace it during the scheduled slot"
    ],
    "spares": [
      {
        "id": "IMP-CF-150",
        "name": "Pump impeller 150 mm",
        "qty": 1,
        "min": 1,
        "leadDays": 30,
        "location": "Warehouse B · Rack 1"
      },
      {
        "id": "BRG-6308",
        "name": "Bearing 6308-2RS",
        "qty": 4,
        "min": 2,
        "leadDays": 7,
        "location": "Warehouse A · Rack 3"
      }
    ],
    "similarCases": [
      {
        "workOrder": "WO-10044",
        "similarity": 0.58,
        "date": "17 Sep 2026",
        "assetId": "PMP-WT-01",
        "code": "IMP-WEAR",
        "action": "Replaced worn impeller",
        "hours": 3,
        "technician": "Agus P."
      },
      {
        "workOrder": "WO-09390",
        "similarity": 0.47,
        "date": "09 Jul 2026",
        "assetId": "PMP-CL-03",
        "code": "CAV",
        "action": "Cleared a blocked suction line",
        "hours": 1.5,
        "technician": "Hendra W."
      },
      {
        "workOrder": "WO-08821",
        "similarity": 0.34,
        "date": "02 May 2026",
        "assetId": "PMP-WT-01",
        "code": "MIS-ALN",
        "action": "Coupling alignment",
        "hours": 1,
        "technician": "Agus P."
      }
    ],
    "documents": [
      {
        "id": "MAN-PMP-04",
        "type": "Manual",
        "title": "Centrifugal pump manual – Troubleshooting",
        "pages": "pp. 30–33",
        "snippet": "Symptom table for vibration, cavitation, and common causes."
      }
    ],
    "notes": [],
    "log": []
  },
  {
    "id": "BR-2026-1102-011",
    "workOrder": "WO-10452",
    "assetId": "EXF-L3-04",
    "description": "Line 3 exhaust fan stopped, area feels hot",
    "tags": [
      "fan stopped",
      "hot"
    ],
    "machineStatus": "stopped",
    "safetyFlag": false,
    "history": "normal",
    "reporter": "Rina P. · Line 3 Operator",
    "receivedAt": "14:53",
    "minutesAgo": 25,
    "state": "new",
    "technician": "Rudi H.",
    "cause": null,
    "causeConfidence": null,
    "inferred": false,
    "evidence": null,
    "estimatedHours": null,
    "latencyMs": 1210,
    "fallback": "no_history",
    "actions": [
      "Switch off and lock out the fan panel",
      "Check supply voltage at the motor terminals",
      "Measure the start capacitor and compare with the µF on the nameplate",
      "Turn by hand to check the motor bearing",
      "Replace the motor if the winding is burnt"
    ],
    "spares": [
      {
        "id": "MTR-075",
        "name": "Motor 0.75 kW 4P",
        "qty": 1,
        "min": 1,
        "leadDays": 14,
        "location": "Warehouse A · Rack 11"
      },
      {
        "id": "CAP-25UF",
        "name": "Capacitor 25 µF",
        "qty": 6,
        "min": 2,
        "leadDays": 5,
        "location": "Electrical Store"
      }
    ],
    "similarCases": [],
    "documents": [
      {
        "id": "SOP-EXF-01",
        "type": "SOP",
        "title": "Exhaust Fan Repair SOP",
        "pages": "pp. 1–4",
        "snippet": "Diagnosing single-phase fan motors and replacing capacitors."
      }
    ],
    "notes": [],
    "log": []
  },
  {
    "id": "BR-2026-1102-015",
    "workOrder": "WO-10461",
    "assetId": "IMM-L4-02",
    "description": "Line 4 injection molder stopped, hopper dryer low-temperature alarm",
    "tags": [
      "alarm",
      "machine stopped"
    ],
    "machineStatus": "stopped",
    "safetyFlag": false,
    "history": "above",
    "reporter": "Fajar N. · Line 4 Operator",
    "receivedAt": "15:18",
    "minutesAgo": 0,
    "state": "new",
    "technician": "Rudi H.",
    "hidden": true,
    "cause": "Hopper dryer heater open circuit",
    "causeConfidence": "High",
    "inferred": false,
    "evidence": "2 of 3 similar cases (WO-10198, WO-09102)",
    "estimatedHours": 1.5,
    "latencyMs": 1520,
    "fallback": null,
    "actions": [
      "Lock out the dryer panel per SOP-LOTO-05",
      "Measure heater resistance (normal 18–22 Ω)",
      "Check the thermocouple and heater contactor",
      "Replace the heater if open circuit",
      "Pre-dry material for 2 hours before restarting production"
    ],
    "spares": [
      {
        "id": "HTR-DRY-6K",
        "name": "Dryer heater 6 kW",
        "qty": 1,
        "min": 1,
        "leadDays": 12,
        "location": "Electrical Store"
      },
      {
        "id": "TC-K-150",
        "name": "Type K thermocouple",
        "qty": 4,
        "min": 2,
        "leadDays": 5,
        "location": "Electrical Store"
      },
      {
        "id": "CTR-40A",
        "name": "Contactor 40 A",
        "qty": 0,
        "min": 2,
        "leadDays": 5,
        "location": "Electrical Store"
      }
    ],
    "similarCases": [
      {
        "workOrder": "WO-10198",
        "similarity": 0.71,
        "date": "22 Sep 2026",
        "assetId": "IMM-L4-02",
        "code": "HTR-OPEN",
        "action": "Replaced 6 kW dryer heater",
        "hours": 1.5,
        "technician": "Rudi H."
      },
      {
        "workOrder": "WO-09640",
        "similarity": 0.58,
        "date": "30 Jul 2026",
        "assetId": "IMM-L4-02",
        "code": "TC-FAIL",
        "action": "Replaced type K thermocouple",
        "hours": 1,
        "technician": "Agus P."
      },
      {
        "workOrder": "WO-09102",
        "similarity": 0.36,
        "date": "12 Jun 2026",
        "assetId": "IMM-L4-02",
        "code": "HTR-OPEN",
        "action": "Replaced heater + tightened terminals",
        "hours": 1.8,
        "technician": "Rudi H."
      }
    ],
    "documents": [
      {
        "id": "MAN-IMM-12",
        "type": "Manual",
        "title": "Hopper dryer manual – Temperature alarms",
        "pages": "pp. 18–20",
        "snippet": "Meaning of the low-temperature alarm, heater resistance values, and check sequence."
      },
      {
        "id": "SOP-LOTO-05",
        "type": "SOP",
        "title": "Injection Molder Lock-out SOP",
        "pages": "pp. 1–3",
        "snippet": "Isolation points for the main panel and dryer panel."
      }
    ],
    "notes": [],
    "log": []
  },
  {
    "id": "BR-2026-1101-031",
    "workOrder": "WO-10402",
    "assetId": "CHL-UT-01",
    "description": "Utility chiller tripped, chilled water temperature rising",
    "tags": [
      "trip",
      "overheating"
    ],
    "machineStatus": "stopped",
    "safetyFlag": false,
    "history": "above",
    "reporter": "Yusuf A. · Utility Operator",
    "receivedAt": "21:02",
    "minutesAgo": 1096,
    "state": "completed",
    "technician": "Agus P.",
    "cause": "Low refrigerant",
    "causeConfidence": "Medium",
    "inferred": false,
    "evidence": "2 of 3 similar cases",
    "estimatedHours": 5.5,
    "latencyMs": 1760,
    "fallback": null,
    "actions": [
      "Shut down the chiller and lock out the compressor panel",
      "Check refrigerant suction and discharge pressure",
      "Leak-test the pipe joints",
      "Recharge refrigerant to specification"
    ],
    "spares": [
      {
        "id": "REF-R134",
        "name": "Refrigerant R134a (cylinder)",
        "qty": 3,
        "min": 1,
        "leadDays": 7,
        "location": "Warehouse B · Rack 6"
      }
    ],
    "similarCases": [
      {
        "workOrder": "WO-10110",
        "similarity": 0.62,
        "date": "01 Oct 2026",
        "assetId": "CHL-UT-01",
        "code": "REF-LOW",
        "action": "Recharged refrigerant, leak-tested",
        "hours": 5,
        "technician": "Agus P."
      }
    ],
    "documents": [
      {
        "id": "MAN-CHL-02",
        "type": "Manual",
        "title": "Chiller manual – Refrigerant pressure",
        "pages": "pp. 40–44",
        "snippet": "Suction and discharge pressure limits, leak detection steps."
      }
    ],
    "override": {
      "from": "P3",
      "to": "P2",
      "reason": "Line 4 molds affected too; chiller 02 not sufficient",
      "by": "Siti W.",
      "at": "1 Nov, 21:14"
    },
    "notes": [],
    "log": []
  },
  {
    "id": "BR-2026-1024-017",
    "workOrder": "WO-10288",
    "assetId": "CRN-OH-02",
    "description": "Crane indicator lamp not lighting, hoist working normally",
    "tags": [
      "indicator lamp"
    ],
    "machineStatus": "running",
    "safetyFlag": false,
    "history": "above",
    "reporter": "Bayu R. · Warehouse Operator",
    "receivedAt": "09:40",
    "minutesAgo": 13298,
    "state": "completed",
    "technician": "Bayu S.",
    "cause": "Indicator lamp burnt out",
    "causeConfidence": "High",
    "inferred": false,
    "evidence": "1 of 1 similar case",
    "estimatedHours": 0.5,
    "latencyMs": 1380,
    "fallback": null,
    "actions": [
      "Park the crane and lock out the panel",
      "Check the fuse and indicator lamp voltage",
      "Replace the 24 V indicator lamp"
    ],
    "spares": [
      {
        "id": "LMP-IND-24",
        "name": "Indicator lamp 24 V",
        "qty": 12,
        "min": 4,
        "leadDays": 3,
        "location": "Electrical Store"
      }
    ],
    "similarCases": [
      {
        "workOrder": "WO-09980",
        "similarity": 0.55,
        "date": "12 Sep 2026",
        "assetId": "CRN-OH-02",
        "code": "IND-LMP",
        "action": "Replaced panel indicator lamp",
        "hours": 0.5,
        "technician": "Bayu S."
      }
    ],
    "documents": [
      {
        "id": "SOP-CRN-02",
        "type": "SOP",
        "title": "Crane Daily Inspection SOP",
        "pages": "p. 2",
        "snippet": "Checking indicator lamps and limit switches before operation."
      }
    ],
    "notes": [],
    "log": []
  }
];

export const WORK_ORDER_HISTORY: WorkOrderHistory[] = [
  {
    "workOrder": "WO-10231",
    "assetId": "CMP-L2-01",
    "date": "12 Oct 2026",
    "iso": "2026-10-12",
    "code": "BRG-WEAR",
    "description": "Rough noise at motor side, high bearing temperature",
    "action": "Replaced motor-side bearing",
    "hours": 3,
    "technician": "Rudi H.",
    "parts": [
      {
        "id": "BRG-6310",
        "qty": 1
      },
      {
        "id": "GRS-LGHP2",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-09877",
    "assetId": "CMP-L2-01",
    "date": "24 Sep 2026",
    "iso": "2026-09-24",
    "code": "BRG-WEAR",
    "description": "Loud noise, bearing running hot",
    "action": "Replaced bearing + coupling alignment",
    "hours": 3.5,
    "technician": "Dedi K.",
    "parts": [
      {
        "id": "BRG-6310",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-09204",
    "assetId": "CMP-L2-01",
    "date": "30 Jun 2026",
    "iso": "2026-06-30",
    "code": "VLV-UNL",
    "description": "Compressor not loading, pressure low",
    "action": "Replaced unloader valve",
    "hours": 4.1,
    "technician": "Agus P.",
    "parts": []
  },
  {
    "workOrder": "WO-08712",
    "assetId": "CMP-L2-01",
    "date": "19 May 2026",
    "iso": "2026-05-19",
    "code": "FLT-CLOG",
    "description": "Pressure dropping, dirty intake filter",
    "action": "Cleaned intake filter, checked unloader valve",
    "hours": 1.5,
    "technician": "Rudi H.",
    "parts": []
  },
  {
    "workOrder": "WO-08105",
    "assetId": "CMP-L2-01",
    "date": "08 Feb 2026",
    "iso": "2026-02-08",
    "code": "FLT-CLOG",
    "description": "Low discharge pressure",
    "action": "Replaced intake filter element",
    "hours": 2.4,
    "technician": "Bayu S.",
    "parts": []
  },
  {
    "workOrder": "WO-07560",
    "assetId": "CMP-L2-01",
    "date": "03 Dec 2025",
    "iso": "2025-12-03",
    "code": "BRG-WEAR",
    "description": "Abnormal sound from motor side",
    "action": "Replaced motor-side bearing",
    "hours": 4.1,
    "technician": "Dedi K.",
    "parts": [
      {
        "id": "BRG-6310",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-09931",
    "assetId": "BLR-UT-01",
    "date": "03 Sep 2026",
    "iso": "2026-09-03",
    "code": "NZL-CLOG",
    "description": "Unstable burner flame, soot on the nozzle",
    "action": "Cleaned and replaced burner nozzle",
    "hours": 2,
    "technician": "Dedi K.",
    "parts": [
      {
        "id": "NZL-BRN-3",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-08450",
    "assetId": "BLR-UT-01",
    "date": "11 Apr 2026",
    "iso": "2026-04-11",
    "code": "AFR-ADJ",
    "description": "Incomplete combustion, black smoke",
    "action": "Re-tuned air–fuel ratio",
    "hours": 1.5,
    "technician": "Agus P.",
    "parts": []
  },
  {
    "workOrder": "WO-10102",
    "assetId": "HYD-PR-05",
    "date": "28 Sep 2026",
    "iso": "2026-09-28",
    "code": "SEAL-LEAK",
    "description": "Oil seeping at the main cylinder",
    "action": "Replaced main cylinder seal kit",
    "hours": 4.5,
    "technician": "Agus P.",
    "parts": [
      {
        "id": "SEAL-HYD-200",
        "qty": 1
      },
      {
        "id": "OIL-HYD-46",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-09511",
    "assetId": "HYD-PR-05",
    "date": "02 Jul 2026",
    "iso": "2026-07-02",
    "code": "SEAL-LEAK",
    "description": "Oil leak at the cylinder rod",
    "action": "Replaced seal + polished rod",
    "hours": 5,
    "technician": "Rudi H.",
    "parts": [
      {
        "id": "SEAL-HYD-200",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-08876",
    "assetId": "HYD-PR-05",
    "date": "15 May 2026",
    "iso": "2026-05-15",
    "code": "FIT-LEAK",
    "description": "Oil dripping at a hose fitting",
    "action": "Replaced seal and fitting O-ring",
    "hours": 3,
    "technician": "Agus P.",
    "parts": []
  },
  {
    "workOrder": "WO-07981",
    "assetId": "HYD-PR-05",
    "date": "20 Jan 2026",
    "iso": "2026-01-20",
    "code": "SEAL-LEAK",
    "description": "Cylinder seeping oil, ram drifting",
    "action": "Replaced main cylinder seal kit",
    "hours": 4.4,
    "technician": "Dedi K.",
    "parts": [
      {
        "id": "SEAL-HYD-200",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-07402",
    "assetId": "HYD-PR-05",
    "date": "18 Nov 2025",
    "iso": "2025-11-18",
    "code": "SEAL-LEAK",
    "description": "Oil pooling under the press",
    "action": "Replaced rod seal",
    "hours": 4.1,
    "technician": "Agus P.",
    "parts": []
  },
  {
    "workOrder": "WO-10311",
    "assetId": "CNV-L1-03",
    "date": "08 Oct 2026",
    "iso": "2026-10-08",
    "code": "BLT-TEN",
    "description": "Belt slipping under full load, running slow",
    "action": "Adjusted belt take-up",
    "hours": 0.8,
    "technician": "Bayu S.",
    "parts": []
  },
  {
    "workOrder": "WO-09720",
    "assetId": "CNV-L1-03",
    "date": "14 Aug 2026",
    "iso": "2026-08-14",
    "code": "LAG-WEAR",
    "description": "Glazed pulley lagging, belt slipping",
    "action": "Replaced drive pulley lagging",
    "hours": 2.5,
    "technician": "Rudi H.",
    "parts": [
      {
        "id": "LAG-PUL-500",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-09012",
    "assetId": "CNV-L1-03",
    "date": "21 Jun 2026",
    "iso": "2026-06-21",
    "code": "SPL-MAT",
    "description": "Material building up under the belt",
    "action": "Cleared material under the belt",
    "hours": 0.5,
    "technician": "Bayu S.",
    "parts": []
  },
  {
    "workOrder": "WO-08640",
    "assetId": "CNV-L1-03",
    "date": "06 May 2026",
    "iso": "2026-05-06",
    "code": "BLT-TEN",
    "description": "Conveyor running slow",
    "action": "Adjusted take-up tension",
    "hours": 0.9,
    "technician": "Bayu S.",
    "parts": []
  },
  {
    "workOrder": "WO-08033",
    "assetId": "CNV-L1-03",
    "date": "02 Feb 2026",
    "iso": "2026-02-02",
    "code": "LAG-WEAR",
    "description": "Belt slipping at the drive pulley",
    "action": "Re-lagged drive pulley",
    "hours": 1.6,
    "technician": "Rudi H.",
    "parts": [
      {
        "id": "LAG-PUL-500",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-07701",
    "assetId": "CNV-L1-03",
    "date": "15 Dec 2025",
    "iso": "2025-12-15",
    "code": "SPL-MAT",
    "description": "Belt tracking off, spillage",
    "action": "Cleared spillage, adjusted tracking",
    "hours": 0.6,
    "technician": "Bayu S.",
    "parts": []
  },
  {
    "workOrder": "WO-07455",
    "assetId": "CNV-L1-03",
    "date": "24 Nov 2025",
    "iso": "2025-11-24",
    "code": "BLT-TEN",
    "description": "Belt slip at start-up",
    "action": "Adjusted take-up",
    "hours": 0.8,
    "technician": "Agus P.",
    "parts": []
  },
  {
    "workOrder": "WO-10044",
    "assetId": "PMP-WT-01",
    "date": "17 Sep 2026",
    "iso": "2026-09-17",
    "code": "IMP-WEAR",
    "description": "High vibration and reduced flow",
    "action": "Replaced worn impeller",
    "hours": 3,
    "technician": "Agus P.",
    "parts": [
      {
        "id": "IMP-CF-150",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-08821",
    "assetId": "PMP-WT-01",
    "date": "02 May 2026",
    "iso": "2026-05-02",
    "code": "MIS-ALN",
    "description": "Vibration at the motor–pump coupling",
    "action": "Coupling alignment",
    "hours": 1,
    "technician": "Agus P.",
    "parts": []
  },
  {
    "workOrder": "WO-10049",
    "assetId": "PMP-WT-02",
    "date": "09 Sep 2026",
    "iso": "2026-09-09",
    "code": "CAV",
    "description": "Gravel-like noise in the pump, low suction pressure",
    "action": "Cleared suction strainer, re-primed pump",
    "hours": 2.6,
    "technician": "Agus P.",
    "parts": []
  },
  {
    "workOrder": "WO-08310",
    "assetId": "PMP-WT-02",
    "date": "28 May 2026",
    "iso": "2026-05-28",
    "code": "IMP-WEAR",
    "description": "High vibration, reduced flow",
    "action": "Balanced and refitted impeller",
    "hours": 1.8,
    "technician": "Agus P.",
    "parts": [
      {
        "id": "BRG-6308",
        "qty": 2
      }
    ]
  },
  {
    "workOrder": "WO-09390",
    "assetId": "PMP-CL-03",
    "date": "09 Jul 2026",
    "iso": "2026-07-09",
    "code": "CAV",
    "description": "Gravel-like noise, low suction pressure",
    "action": "Cleared a blocked suction line",
    "hours": 1.5,
    "technician": "Hendra W.",
    "parts": []
  },
  {
    "workOrder": "WO-10198",
    "assetId": "IMM-L4-02",
    "date": "22 Sep 2026",
    "iso": "2026-09-22",
    "code": "HTR-OPEN",
    "description": "Low-temperature alarm on the hopper dryer",
    "action": "Replaced 6 kW dryer heater",
    "hours": 1.5,
    "technician": "Rudi H.",
    "parts": [
      {
        "id": "HTR-DRY-6K",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-09640",
    "assetId": "IMM-L4-02",
    "date": "30 Jul 2026",
    "iso": "2026-07-30",
    "code": "TC-FAIL",
    "description": "Unstable dryer temperature reading",
    "action": "Replaced type K thermocouple",
    "hours": 1,
    "technician": "Agus P.",
    "parts": [
      {
        "id": "TC-K-150",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-09102",
    "assetId": "IMM-L4-02",
    "date": "12 Jun 2026",
    "iso": "2026-06-12",
    "code": "HTR-OPEN",
    "description": "Dryer not reaching set temperature",
    "action": "Replaced heater + tightened terminals",
    "hours": 1.8,
    "technician": "Rudi H.",
    "parts": [
      {
        "id": "HTR-DRY-6K",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-07890",
    "assetId": "IMM-L4-02",
    "date": "14 Jan 2026",
    "iso": "2026-01-14",
    "code": "TRM-LOOSE",
    "description": "Heater cycling on and off, hot terminal",
    "action": "Re-terminated heater cables",
    "hours": 1.3,
    "technician": "Dedi K.",
    "parts": []
  },
  {
    "workOrder": "WO-10415",
    "assetId": "CRN-OH-02",
    "date": "01 Nov 2026",
    "iso": "2026-11-01",
    "code": "IND-LMP",
    "description": "Indicator lamp off again, hoist normal",
    "action": "Replaced lamp holder and connector",
    "hours": 0.4,
    "technician": "Bayu S.",
    "parts": [
      {
        "id": "LMP-IND-24",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-10288",
    "assetId": "CRN-OH-02",
    "date": "24 Oct 2026",
    "iso": "2026-10-24",
    "code": "IND-LMP",
    "description": "Crane indicator lamp not lighting, hoist working normally",
    "action": "Replaced 24 V indicator lamp",
    "hours": 0.5,
    "technician": "Bayu S.",
    "parts": [
      {
        "id": "LMP-IND-24",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-09980",
    "assetId": "CRN-OH-02",
    "date": "12 Sep 2026",
    "iso": "2026-09-12",
    "code": "IND-LMP",
    "description": "Panel indicator lamp not lighting",
    "action": "Replaced panel indicator lamp",
    "hours": 0.5,
    "technician": "Bayu S.",
    "parts": [
      {
        "id": "LMP-IND-24",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-08560",
    "assetId": "CRN-OH-02",
    "date": "20 Apr 2026",
    "iso": "2026-04-20",
    "code": "LMT-SW",
    "description": "Hoist stops before the upper limit",
    "action": "Adjusted upper limit switch",
    "hours": 1.2,
    "technician": "Bayu S.",
    "parts": []
  },
  {
    "workOrder": "WO-10402",
    "assetId": "CHL-UT-01",
    "date": "01 Nov 2026",
    "iso": "2026-11-01",
    "code": "REF-LOW",
    "description": "Chiller tripped, chilled water temperature rising",
    "action": "Leak-sealed flare joint, recharged R134a",
    "hours": 5.5,
    "technician": "Agus P.",
    "parts": [
      {
        "id": "REF-R134",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-10110",
    "assetId": "CHL-UT-01",
    "date": "01 Oct 2026",
    "iso": "2026-10-01",
    "code": "REF-LOW",
    "description": "Chilled water temperature rising, low refrigerant pressure",
    "action": "Recharged refrigerant, leak-tested",
    "hours": 5,
    "technician": "Agus P.",
    "parts": [
      {
        "id": "REF-R134",
        "qty": 1
      }
    ]
  },
  {
    "workOrder": "WO-08702",
    "assetId": "CHL-UT-01",
    "date": "21 May 2026",
    "iso": "2026-05-21",
    "code": "FAN-COND",
    "description": "High head pressure, condenser fan not running",
    "action": "Replaced condenser fan motor",
    "hours": 6,
    "technician": "Dedi K.",
    "parts": []
  }
];

export const PART_NAMES: Record<string, string> = {
  "BRG-6310": "Bearing 6310-2RS",
  "BRG-6308": "Bearing 6308-2RS",
  "SEAL-CMP-22": "Compressor seal kit",
  "GRS-LGHP2": "High-temp bearing grease",
  "NZL-BRN-3": "Burner nozzle 3 GPH",
  "ELC-IGN-2": "Ignition electrode",
  "GSK-BRN": "Burner gasket",
  "SEAL-HYD-200": "200 T cylinder seal kit",
  "OIL-HYD-46": "Hydraulic oil ISO VG 46",
  "LAG-PUL-500": "Pulley lagging 500 mm",
  "IMP-CF-150": "Pump impeller 150 mm",
  "MTR-075": "Motor 0.75 kW 4P",
  "CAP-25UF": "Capacitor 25 µF",
  "HTR-DRY-6K": "Dryer heater 6 kW",
  "TC-K-150": "Type K thermocouple",
  "CTR-40A": "Contactor 40 A",
  "REF-R134": "Refrigerant R134a",
  "LMP-IND-24": "Indicator lamp 24 V"
};

export const FAILURE_CODE_DESCRIPTIONS: Record<string, string> = {
  "REF-LOW": "Chilled water temperature rising, low refrigerant pressure",
  "IND-LMP": "Panel indicator lamp not lighting",
  "BRG-WEAR": "Rough noise at the motor side, high bearing temperature",
  "FLT-CLOG": "Pressure dropping, dirty intake filter",
  "NZL-CLOG": "Unstable burner flame, soot on the nozzle",
  "AFR-ADJ": "Incomplete combustion, black smoke",
  "SEAL-LEAK": "Oil seeping at the main cylinder",
  "FIT-LEAK": "Oil dripping at a hose fitting",
  "BLT-TEN": "Belt slipping under full load, running slow",
  "LAG-WEAR": "Glazed pulley lagging, belt slipping",
  "SPL-MAT": "Material building up under the belt",
  "IMP-WEAR": "High vibration and reduced flow",
  "CAV": "Gravel-like noise in the pump, low suction pressure",
  "MIS-ALN": "Vibration at the motor–pump coupling",
  "HTR-OPEN": "Low-temperature alarm on the hopper dryer",
  "TC-FAIL": "Unstable dryer temperature reading",
  "TRM-LOOSE": "Heater cycling on and off, hot terminal"
};

export const SYNONYMS: SynonymEntry[] = [
  {
    "id": 1,
    "term": "leak",
    "synonyms": [
      "bocor",
      "rembes",
      "rembesan",
      "seepage",
      "dripping"
    ],
    "category": "Symptom",
    "enabled": true,
    "uses": 41,
    "updatedBy": "Siti W.",
    "updatedAt": "20 Oct 2026"
  },
  {
    "id": 2,
    "term": "loud noise",
    "synonyms": [
      "bunyi keras",
      "berisik",
      "ngorok",
      "abnormal sound"
    ],
    "category": "Symptom",
    "enabled": true,
    "uses": 33,
    "updatedBy": "Siti W.",
    "updatedAt": "20 Oct 2026"
  },
  {
    "id": 3,
    "term": "vibration",
    "synonyms": [
      "getaran",
      "vibrasi",
      "shaking"
    ],
    "category": "Symptom",
    "enabled": true,
    "uses": 28,
    "updatedBy": "Bambang S.",
    "updatedAt": "15 Oct 2026"
  },
  {
    "id": 4,
    "term": "pressure drop",
    "synonyms": [
      "tekanan turun",
      "low pressure",
      "drop tekanan"
    ],
    "category": "Symptom",
    "enabled": true,
    "uses": 19,
    "updatedBy": "Bambang S.",
    "updatedAt": "15 Oct 2026"
  },
  {
    "id": 5,
    "term": "overheating",
    "synonyms": [
      "overheat",
      "panas berlebih",
      "kepanasan",
      "running hot"
    ],
    "category": "Symptom",
    "enabled": true,
    "uses": 22,
    "updatedBy": "Siti W.",
    "updatedAt": "08 Oct 2026"
  },
  {
    "id": 6,
    "term": "jammed",
    "synonyms": [
      "stuck",
      "macet",
      "nyangkut"
    ],
    "category": "Symptom",
    "enabled": true,
    "uses": 15,
    "updatedBy": "Siti W.",
    "updatedAt": "08 Oct 2026"
  },
  {
    "id": 7,
    "term": "bearing",
    "synonyms": [
      "laher",
      "bantalan",
      "klaher"
    ],
    "category": "Component",
    "enabled": true,
    "uses": 37,
    "updatedBy": "Bambang S.",
    "updatedAt": "29 Sep 2026"
  },
  {
    "id": 8,
    "term": "contactor",
    "synonyms": [
      "kontaktor",
      "mc",
      "magnetic contactor"
    ],
    "category": "Component",
    "enabled": true,
    "uses": 9,
    "updatedBy": "Bambang S.",
    "updatedAt": "29 Sep 2026"
  },
  {
    "id": 9,
    "term": "replace",
    "synonyms": [
      "ganti",
      "swap",
      "changeout"
    ],
    "category": "Action",
    "enabled": false,
    "uses": 0,
    "updatedBy": "Altimeda",
    "updatedAt": "29 Sep 2026"
  }
];

export const INSIGHTS: AiInsight[] = [
  {
    "id": "INS-1102-01",
    "type": "anomaly",
    "severity": "High",
    "assetId": "CMP-L2-01",
    "codes": [
      "BRG-WEAR"
    ],
    "reportId": "BR-2026-1102-014",
    "partId": "BRG-6310",
    "confidence": 0.88,
    "createdAt": "02 Nov 15:15",
    "title": "Bearing failures on Line 2 Air Compressor are getting closer together",
    "description": "The last two bearing replacements were 18 days apart, down from 295 days before. Today’s report (loud noise, pressure dropping) matches the same pattern.",
    "basis": "Based on 6 breakdown WOs and 1 open report · last 12 months",
    "why": [
      "3 of 6 breakdowns were coded BRG-WEAR: 03 Dec 2025, 24 Sep 2026, 12 Oct 2026.",
      "The gap between bearing failures shrank from 295 days to 18 days.",
      "Each replacement used one BRG-6310 bearing. 2 are left in stock.",
      "Today’s report BR-2026-1102-014 describes the same symptoms as WO-10231."
    ],
    "suggestion": "Assign a vibration and alignment check after today’s repair, so the root cause is found instead of replacing the bearing a fourth time.",
    "kind": "inspect",
    "actionLabel": "Assign inspection",
    "status": "open",
    "log": []
  },
  {
    "id": "INS-1102-02",
    "type": "prediction",
    "severity": "High",
    "assetId": "BLR-UT-01",
    "codes": [
      "NZL-CLOG"
    ],
    "reportId": "BR-2026-1102-012",
    "partId": "NZL-BRN-3",
    "confidence": 0.81,
    "createdAt": "02 Nov 15:15",
    "title": "Utility Boiler 1 repair may need a burner nozzle that is out of stock",
    "description": "Today’s report (smoke, unstable flame) matches the September nozzle failure. Burner nozzle NZL-BRN-3 has 0 in stock and a 14-day lead time.",
    "basis": "Based on 2 breakdown WOs, 1 open report, and Fabrix stock · last 12 months",
    "why": [
      "WO-09931 on 03 Sep 2026 (NZL-CLOG) had the same symptoms and needed one NZL-BRN-3 nozzle.",
      "Stock for NZL-BRN-3 is 0, below the minimum of 1.",
      "Supplier lead time is 14 days, longer than a P1 repair can wait."
    ],
    "suggestion": "Send a reorder request for 2 nozzles now, and ask the technician to check whether the current nozzle can be cleaned as a stopgap.",
    "kind": "purchase",
    "actionLabel": "Request reorder",
    "qty": 2,
    "status": "open",
    "log": []
  },
  {
    "id": "INS-1102-03",
    "type": "prediction",
    "severity": "High",
    "assetId": "HYD-PR-05",
    "codes": [
      "SEAL-LEAK"
    ],
    "reportId": "BR-2026-1102-009",
    "partId": "SEAL-HYD-200",
    "confidence": 0.84,
    "createdAt": "02 Nov 15:15",
    "title": "Hydraulic Press 05 will run out of cylinder seal kits after today’s repair",
    "description": "Seal leaks have recurred 4 times in 12 months and today’s report is the fifth. Only 1 seal kit is left, below the minimum of 2, with a 21-day lead time.",
    "basis": "Based on 5 breakdown WOs, 1 open report, and Fabrix stock · last 12 months",
    "why": [
      "4 of 5 breakdowns were coded SEAL-LEAK, 35 to 163 days apart.",
      "3 of those repairs used one SEAL-HYD-200 kit each.",
      "Today’s report BR-2026-1102-009 (oil seeping from cylinder) will likely use the last kit.",
      "Lead time is 21 days, so the press would have no spare for the next leak."
    ],
    "suggestion": "Send a reorder request for 2 seal kits so stock returns to the minimum.",
    "kind": "purchase",
    "actionLabel": "Request reorder",
    "qty": 2,
    "status": "open",
    "log": []
  },
  {
    "id": "INS-1102-04",
    "type": "anomaly",
    "severity": "Medium",
    "assetId": "CHL-UT-01",
    "codes": [
      "REF-LOW"
    ],
    "reportId": null,
    "partId": "REF-R134",
    "confidence": 0.77,
    "createdAt": "02 Nov 15:15",
    "title": "Utility Chiller 1 was topped up with refrigerant twice in 31 days",
    "description": "Two low-refrigerant breakdowns (01 Oct and 01 Nov) each took over 5 hours. Refilling without finding the leak means it will likely happen again.",
    "basis": "Based on 3 breakdown WOs · last 12 months",
    "why": [
      "WOs on 01 Oct and 01 Nov 2026 were both coded REF-LOW and each used one R134a cylinder.",
      "Average repair time on this chiller is 5.5 h, the highest of all assets.",
      "The 1 Nov report was raised from P3 to P2 by a supervisor because Line 4 molds were affected."
    ],
    "suggestion": "Assign a leak test on the chiller circuit before the next top-up.",
    "kind": "inspect",
    "actionLabel": "Assign leak test",
    "status": "open",
    "log": []
  },
  {
    "id": "INS-1102-05",
    "type": "recommendation",
    "severity": "Medium",
    "assetId": "CRN-OH-02",
    "codes": [
      "IND-LMP"
    ],
    "reportId": null,
    "partId": "LMP-IND-24",
    "confidence": 0.73,
    "createdAt": "02 Nov 15:15",
    "title": "Overhead Crane 02 needed 3 indicator lamps in 50 days",
    "description": "Replacing the lamp fixes the symptom, but three failures in 50 days points to the 24 V supply or the lamp holder.",
    "basis": "Based on 4 breakdown WOs · last 12 months",
    "why": [
      "IND-LMP breakdowns on 12 Sep, 24 Oct and 01 Nov 2026, each using one 24 V lamp.",
      "The repeat flag is active for this asset.",
      "The 1 Nov report was lowered from P1 to P2 because only the lamp was affected."
    ],
    "suggestion": "Assign a check of the 24 V supply voltage and the lamp holder on the next shift.",
    "kind": "inspect",
    "actionLabel": "Assign root-cause check",
    "status": "open",
    "log": []
  },
  {
    "id": "INS-1102-06",
    "type": "recommendation",
    "severity": "Medium",
    "assetId": null,
    "codes": [],
    "reportId": null,
    "partId": null,
    "confidence": 0.79,
    "createdAt": "02 Nov 05:20",
    "title": "Raise the history weight from 0.20 to 0.25",
    "description": "5 of 7 supervisor overrides in the pilot raised the priority of repeat breakdowns. A higher history weight would match supervisors’ judgment more often.",
    "basis": "Based on 50 pilot reports and 7 supervisor overrides",
    "why": [
      "5 of 7 overrides raised a repeat breakdown that scored too low.",
      "Agreement with supervisors goes from 84% to 88% when S_hist is 0.25 and S_prod is 0.20 (simulated, n = 50).",
      "The change needs admin approval, like any scoring change."
    ],
    "suggestion": "Open Scoring & Thresholds and apply the suggested weights to a draft for approval.",
    "kind": "config",
    "actionLabel": "Review in Scoring",
    "status": "open",
    "log": []
  },
  {
    "id": "INS-1102-07",
    "type": "recommendation",
    "severity": "Low",
    "assetId": null,
    "codes": [],
    "reportId": null,
    "partId": null,
    "confidence": 0.95,
    "createdAt": "02 Nov 05:12",
    "title": "Register asset PKG-L5-09 so its work orders can be triaged",
    "description": "WO-10433 was skipped during the 05:12 ETL run because asset PKG-L5-09 is not in the asset master yet.",
    "basis": "Based on the 05:12 ETL run",
    "why": [
      "The Fabrix sync received WO-10433 for PKG-L5-09.",
      "The asset code does not exist in the Atlas asset master, so normalization skipped it.",
      "Reports for unregistered assets get no priority or similar cases."
    ],
    "suggestion": "Ask the Fabrix admin to register PKG-L5-09. The work order is picked up again on the next sync.",
    "kind": "data",
    "actionLabel": "Notify Fabrix admin",
    "status": "open",
    "log": []
  },
  {
    "id": "INS-1025-02",
    "type": "prediction",
    "severity": "Medium",
    "assetId": "HYD-PR-05",
    "codes": [],
    "reportId": null,
    "partId": "OIL-HYD-46",
    "confidence": 0.82,
    "createdAt": "25 Oct 05:15",
    "title": "Hydraulic oil ISO VG 46 would drop below minimum stock",
    "description": "Seal-leak repairs on Hydraulic Press 05 were consuming oil faster than it was being reordered.",
    "basis": "Based on Fabrix stock and 4 breakdown WOs",
    "why": [
      "Stock was 1 drum, equal to the minimum.",
      "The last seal-leak repair used 1 drum."
    ],
    "suggestion": "Reorder 2 drums.",
    "kind": "purchase",
    "actionLabel": "Request reorder",
    "qty": 2,
    "status": "accepted",
    "outcome": "Reorder request sent to Warehouse A for 2 drums · received 29 Oct",
    "log": [
      {
        "event": "Accepted · reorder request for 2 drums",
        "by": "Siti W.",
        "at": "25 Oct 08:41"
      }
    ]
  },
  {
    "id": "INS-1014-01",
    "type": "recommendation",
    "severity": "Low",
    "assetId": "EXF-L3-04",
    "codes": [],
    "reportId": null,
    "partId": null,
    "confidence": 0.66,
    "createdAt": "14 Oct 05:15",
    "title": "Exhaust Fan L3-04 had no breakdowns in 12 months: consider a longer PM interval",
    "description": "Quarterly PM could move to every 6 months to free up technician time.",
    "basis": "Based on 0 breakdown WOs and 4 PM WOs · last 12 months",
    "why": [
      "No breakdown WOs in 12 months.",
      "4 quarterly PMs found no defects."
    ],
    "suggestion": "Extend the PM interval to 6 months.",
    "kind": "config",
    "actionLabel": "Review PM plan",
    "status": "dismissed",
    "outcome": "Dismissed: Not relevant · “Fan is near end of life, keep quarterly PM”",
    "log": [
      {
        "event": "Dismissed · Not relevant",
        "by": "Siti W.",
        "at": "14 Oct 09:02"
      }
    ]
  },
  {
    "id": "INS-1028-01",
    "type": "anomaly",
    "severity": "Low",
    "assetId": "IMM-L4-02",
    "codes": [
      "HTR-OPEN"
    ],
    "reportId": null,
    "partId": "HTR-DRY-6K",
    "confidence": 0.71,
    "createdAt": "28 Oct 05:15",
    "title": "Injection Molder L4-02 dryer heater failed twice in 102 days",
    "description": "Both heater failures needed a new 6 kW heater. Only 1 spare is left, equal to the minimum.",
    "basis": "Based on 4 breakdown WOs and Fabrix stock · last 12 months",
    "why": [
      "HTR-OPEN breakdowns on 12 Jun and 22 Sep 2026, each using one HTR-DRY-6K heater.",
      "1 heater in stock, minimum 1, lead time 12 days."
    ],
    "suggestion": "Check the heater supply terminals at the next PM, since a loose terminal was found in January.",
    "kind": "inspect",
    "actionLabel": "Assign inspection",
    "status": "snoozed",
    "snoozedUntil": "04 Nov",
    "outcome": "Snoozed until 04 Nov. It returns to Open automatically.",
    "log": [
      {
        "event": "Snoozed until 04 Nov",
        "by": "Siti W.",
        "at": "28 Oct 09:30"
      }
    ]
  },
  {
    "id": "INS-1009-01",
    "type": "recommendation",
    "severity": "Medium",
    "assetId": "CNV-L1-03",
    "codes": [
      "BLT-TEN"
    ],
    "reportId": null,
    "partId": null,
    "confidence": 0.76,
    "createdAt": "09 Oct 05:15",
    "title": "Belt Conveyor L1-03 keeps losing belt tension",
    "description": "Three belt-tension breakdowns in 11 months suggest the take-up is not holding, not just a one-off adjustment.",
    "basis": "Based on 7 breakdown WOs · last 12 months",
    "why": [
      "BLT-TEN breakdowns on 24 Nov 2025, 06 May and 08 Oct 2026.",
      "This conveyor has the most breakdowns of all assets (7 in 12 months)."
    ],
    "suggestion": "Assign a check of the take-up and pulley lagging.",
    "kind": "inspect",
    "actionLabel": "Assign inspection",
    "status": "accepted",
    "outcome": "Assigned to Agus P. · due 10 Oct · “take-up spring replaced”",
    "log": [
      {
        "event": "Accepted · inspection assigned to Agus P.",
        "by": "Siti W.",
        "at": "09 Oct 10:12"
      }
    ]
  }
];

export const SCORING_VERSIONS: ScoringVersion[] = [
  { version: 3, author: "Siti W.", approver: "Bambang S.", at: "20 Oct 2026", note: "History weight 0.15 → 0.20 after reviewing 20 reports", status: "active", config: { weights: { criticality: 0.35, production: 0.25, safety: 0.2, history: 0.2 }, p1Threshold: 0.7, p2Threshold: 0.45, safetyKeywords: ["fire", "smoke", "gas leak", "burning", "electric shock"], slaMinutes: { P1: 15, P2: 60, P3: 1440 }, autoEscalate: true } },
  { version: 2, author: "Siti W.", approver: "Bambang S.", at: "08 Oct 2026", note: "Added keyword \"electric shock\"", status: "archived", config: { weights: { criticality: 0.35, production: 0.3, safety: 0.2, history: 0.15 }, p1Threshold: 0.7, p2Threshold: 0.45, safetyKeywords: ["fire", "smoke", "gas leak", "burning", "electric shock"], slaMinutes: { P1: 15, P2: 60, P3: 1440 }, autoEscalate: true } },
  { version: 1, author: "Altimeda", approver: "Bambang S.", at: "29 Sep 2026", note: "Initial weights (hypothesis)", status: "archived", config: { weights: { criticality: 0.35, production: 0.3, safety: 0.2, history: 0.15 }, p1Threshold: 0.7, p2Threshold: 0.45, safetyKeywords: ["fire", "smoke", "gas leak", "burning"], slaMinutes: { P1: 15, P2: 60, P3: 1440 }, autoEscalate: true } },
];

export const OVERRIDE_HISTORY: OverrideRecord[] = [
  {
    "reportId": "BR-2026-1101-031",
    "asset": "Utility Chiller 1",
    "from": "P3",
    "to": "P2",
    "reason": "Line 4 molds affected too; chiller 02 not sufficient",
    "by": "Siti W.",
    "at": "1 Nov, 21:14"
  },
  {
    "reportId": "BR-2026-1101-022",
    "asset": "Overhead Crane 02",
    "from": "P1",
    "to": "P2",
    "reason": "Statutory, but only an indicator lamp; forklift available",
    "by": "Siti W.",
    "at": "1 Nov, 13:40"
  },
  {
    "reportId": "BR-2026-1031-017",
    "asset": "Belt Conveyor L1-03",
    "from": "P3",
    "to": "P2",
    "reason": "Repeated slipping; buffer runs out faster",
    "by": "Joko S.",
    "at": "31 Oct, 09:05"
  }
];
