# ACQUISITION EDGE - Deal Proposal System (v2.0)
## Financial Documentation Generator for Private Capital Raises

**Brand:** Acquisition Edge by C4 Infinity LLC  
**Contact:** sales@c4infinity.com | 754-229-9225 | www.c4infinity.com  
**Colors:** Signal Gold (#C9A84C) on Obsidian (#1A1A1A)

---

## What's New in v2.0

✅ **Header/Footer on Every Page**
- **Header:** Company logo (placeholder - easily replaceable)
- **Footer:** "ACQUISITION EDGE" + Deal date

✅ **Updated Document Title**
- Changed from "ACQUISITION EDGE" to "FINANCIAL STRUCTURE PROPOSAL" (in gold)

✅ **Professional Document Flow**
- Consistent branding across all pages
- Print-ready formatting
- Easy logo customization

---

## Overview

This system generates **investor-ready financial proposals** for business acquisition opportunities. It produces comprehensive Excel-based financial models and Word document narratives that clearly display:

1. **Acquisition structure** - Capital stack with sources, terms, and security
2. **Ongoing cash flow** - Monthly/quarterly distributions to GP and LP
3. **Refinance strategy** (if applicable) - Real estate options, SBA refinancing
4. **Exit waterfall** - Asset sale proceeds distribution by priority

## Files Delivered

### For Emerald Coast Indoor Shooting & Sport:
1. **Emerald_Coast_Investment_Proposal_Updated.docx** - 4-page narrative with headers/footers
2. **Emerald_Coast_Deal_Financials.xlsx** - Full financial model with 4 sheets:
   - Deal Summary
   - Cash Flow Analysis
   - Exit Waterfall
   - 7-Year Timeline

### Reusable Template System:
1. **deal_proposal_generator.py** - Excel generator (JSON-driven)
2. **create_docx_template.py** - Word document generator
3. **emerald_coast_config.json** - Example configuration file
4. **LOGO_INSTRUCTIONS.md** - How to add your company logo

---

## Quick Start: Generate a Complete Proposal Package

### Step 1: Prepare Your Deal Configuration

```bash
# Copy the example config
cp emerald_coast_config.json my_deal.json

# Edit with your deal details
nano my_deal.json
```

### Step 2: Generate Excel Financial Model

```bash
# Create the Excel file
python deal_proposal_generator.py my_deal.json

# Recalculate all formulas (IMPORTANT!)
python /mnt/skills/public/xlsx/scripts/recalc.py YOUR_OUTPUT.xlsx 30
```

### Step 3: Generate Word Document Proposal

```bash
# Without logo (adds placeholder)
node create_updated_proposal.js

# With your logo (edit script to point to logo file)
# See LOGO_INSTRUCTIONS.md for details
```

### Step 4: Add Your Company Logo (Optional)

**Easy Method:** Open the `.docx` file → Double-click header → Insert your logo

**Programmatic Method:** See `LOGO_INSTRUCTIONS.md`

---

## Document Structure

### Word Document Layout

**Every Page Includes:**

**HEADER (Top):**
```
[Company Logo - Centered]
─────────────────────────
```

**FOOTER (Bottom):**
```
─────────────────────────
     ACQUISITION EDGE
      April 16, 2026
```

**Page 1 - Title & Overview:**
- FINANCIAL STRUCTURE PROPOSAL (gold header)
- Company name
- TO/FROM/DATE
- Executive summary

**Pages 2-3 - Deal Structure:**
- Acquisition structure & capital stack
- Monthly cash flow & distributions
- Refinance strategy
- Exit planning & waterfall

**Page 4 - Protection & Contact:**
- Investor protection details
- Risk mitigation
- Contact information

---

## Configuration File Structure

```json
{
  "deal_overview": {
    "company_name": "Your Business Name",
    "date": "MM/DD/YYYY",  // Appears in footer
    "purchase_price": 300000,
    "asset_value": 433000,
    "closing_costs": 25000,
    "real_estate_option": 2375000  // Optional
  },
  "capital_stack": [
    {
      "source": "Source Description",
      "amount": 150000,
      "terms": "12% IO, 24-month balloon",
      "security": "1st lien on assets"
    }
  ],
  "operations": {
    "current_sde": 195664,
    "manager_salary": 70000,
    "manager_label": "Operations Manager Salary"
  },
  "debt_service": [
    {
      "label": "PML Debt Service (12% on $150k)",
      "annual_amount": 18000
    }
  ],
  "distributions": {
    "gp_pct": 0.40,  // 40% to GP
    "lp_pct": 0.60   // 60% to LP
  },
  "exit_strategy": {
    "exit_year": 7,
    "business_ebitda": 200000,
    "ebitda_multiple": 4.0,
    "real_estate_current": 2375000,
    "re_appreciation": 0.04,
    "real_estate_value": true,
    "waterfall": [
      {"payee": "Senior Debt Payoff", "amount": 2100000},
      {"payee": "Return Equity Capital", "amount": 175000}
    ],
    "final_split": {
      "gp_pct": 0.70,
      "lp_pct": 0.30
    }
  },
  "output_filename": "Your_Deal_Name.xlsx"
}
```

---

## Excel Model Features

### Color Coding (Industry Standard)
- **Blue text** = Hardcoded inputs (change for scenarios)
- **Black text** = Formulas and calculations
- **Signal Gold (#C9A84C)** = Brand headers and key outputs
- **Green text** = Final GP proceeds (success metrics)

### Sheet Breakdown

#### 1. Deal Summary
- Purchase price vs. asset value (arbitrage %)
- Complete capital stack with security positions
- Auto-calculated total raise requirement

#### 2. Cash Flow Analysis
- Current SDE and adjustments
- Annual debt service obligations
- Net distributable cash flow
- GP/LP split calculations
- Monthly income projections

#### 3. Exit Waterfall
- Business valuation (EBITDA multiple)
- Real estate appreciation (if applicable)
- Priority-based distribution waterfall
- Final GP/LP profit split

#### 4. 7-Year Timeline
- Year-by-year money flow
- Acquisition → Operations → Refinance → Exit
- Cumulative cash flows for all parties

---

## Key Financial Methodologies

### The Sanchez Method
- Acquiring "boring" high-margin businesses
- High barriers to entry
- 2% acquisition fee structure

### The Morby Method
- Creative real estate control via lease-options
- Rent credit accumulation as forced equity
- Option strike price locks today's valuation

### Asset Arbitrage
- Buying hard assets at discount to book value
- 70 cents on the dollar or better
- Immediate collateral coverage for lenders

---

## Investor Presentation Tips

### Key Metrics to Highlight:
1. **Asset Arbitrage %** - Buying below book value
2. **DSCR** - EBITDA / Total Obligations (>1.5x is strong)
3. **Cash-on-Cash Return** - Annual distributions / Capital invested
4. **Exit Multiple** - Total proceeds / Initial investment
5. **GP Monthly Income** - Path to $10k/month goal

### Risk Mitigation Points:
- Collateral coverage ratios (e.g., $206k FF&E securing $150k loan = 138% LTV)
- ROFR (Right of First Refusal) on real estate
- FFL management agreements (regulatory compliance)
- Operations manager (passive income structure)

### Deal Flow Narrative:
1. **Acquisition (Year 0):** "We're buying $433k in assets for $300k cash"
2. **Operations (Years 1-4):** "Generating $90k/year in net cash flow"
3. **Refinance (Year 5):** "Converting $96k rent credits + forced equity into ownership"
4. **Exit (Year 7):** "Selling for $3.9M total, netting GP $1.1M+"

---

## Customization Guide

### No Real Estate Component:
```json
"exit_strategy": {
  "real_estate_value": false
  // Omit RE-specific fields
}
```

### Different Distribution Splits:
```json
"distributions": {
  "gp_pct": 0.50,  // 50/50 split
  "lp_pct": 0.50
}
```

### Multiple Debt Layers:
```json
"debt_service": [
  {"label": "Senior Debt", "annual_amount": 50000},
  {"label": "Mezzanine Debt", "annual_amount": 30000},
  {"label": "Seller Note", "annual_amount": 20000}
]
```

### Custom Footer Branding:
Edit the Word document generator to change footer text from "ACQUISITION EDGE" to your brand name.

---

## Technical Requirements

### Software Dependencies:
```bash
# Python
pip install openpyxl

# Node.js
npm install -g docx

# LibreOffice (for formula recalculation)
# Already installed in most environments
```

### File Formats:
- **Excel:** `.xlsx` format (not `.xls`)
- **Word:** `.docx` format (not `.doc`)
- **Logo:** `.png` or `.jpg` (PNG with transparency recommended)

---

## File Organization

```
deal_proposal_system/
├── deal_proposal_generator.py       # Excel generator
├── create_docx_template.py          # Word generator
├── emerald_coast_config.json        # Example config
├── ACQUISITION_EDGE_README_v2.md    # This file
├── LOGO_INSTRUCTIONS.md             # Logo integration guide
└── output/
    ├── Emerald_Coast_Deal_Financials.xlsx
    └── Emerald_Coast_Investment_Proposal_Updated.docx
```

---

## Support & Custom Development

For custom deal structures, template modifications, or integration support:

**Christopher Carwise**  
Acquisition Edge by C4 Infinity LLC  
📧 sales@c4infinity.com  
📱 754-229-9225  
🌐 www.c4infinity.com

---

## Version History

- **v2.0** (4/16/2026) - Header/footer updates
  - Added header with logo placeholder
  - Added footer with "ACQUISITION EDGE" + date
  - Changed title to "FINANCIAL STRUCTURE PROPOSAL"
  - Created logo integration documentation
  
- **v1.0** (4/16/2026) - Initial release
  - Emerald Coast deal documentation
  - Reusable JSON-driven generators
  - 4-sheet Excel model + Word narrative

---

**Generated by Acquisition Edge Platform**  
Powered by C4 Infinity LLC
