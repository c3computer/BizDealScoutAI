import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Header, Footer } from 'docx';
import { InvestorProfile, DealOpportunity, LOITerms } from '../types';
import { GoogleGenAI, Type, Schema } from '@google/genai';

async function parseCapitalStackFromMarkdown(markdown: string, fallbackEmd: number, fallbackAcqFee: number, purchasePrice: number, closingCosts: number) {
  let defaultStack = [
    { source: 'Earnest Money (Gator)', amount: fallbackEmd, terms: `$${(fallbackEmd * 2).toLocaleString()} flat return at close`, security: 'Unsecured', type: 'debt' },
    { source: 'Acquisition Fee (GP)', amount: fallbackAcqFee, terms: 'Fee paid at closing', security: 'N/A', type: 'fee' },
    { source: 'Private Money Lender (Tier 1)', amount: purchasePrice * 0.5, terms: '12% IO, 24-month balloon', security: '1st lien on Assets', type: 'debt' },
    { source: 'Equity Partners (Tier 2)', amount: purchasePrice * 0.5 + closingCosts - (fallbackEmd + fallbackAcqFee), terms: '10% pref + 60% equity', security: '60% LLC ownership', type: 'equity' }
  ];
  if (!markdown || markdown.trim().length === 0) return defaultStack;

  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const ai = new GoogleGenAI({ apiKey });
    
    const schema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: "Name of the funding source (e.g. 'Seller Financing', 'Private Money Lender', 'Acquisition Fee')" },
          amount: { type: Type.NUMBER, description: "Numeric amount in dollars" },
          terms: { type: Type.STRING, description: "Terms of the capital (e.g. '0% interest, 2 years', 'Fee paid at closing')" },
          security: { type: Type.STRING, description: "Security or collateral (e.g. 'Unsecured', '1st lien', '60% LLC ownership')" },
          type: { type: Type.STRING, description: "Type of capital: 'debt', 'equity', 'fee', or 'other'" }
        },
        required: ['source', 'amount', 'terms', 'security', 'type']
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a financial analyst extracting the Capital Stack table from a pitch deck proposal. Extract the capital sources, amounts, terms, and security into a JSON array of objects.

Markdown content to parse:
"""
${markdown}
"""
`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse capital stack with AI, falling back to defaults", error);
  }

  return defaultStack;
}

export const generateDealProposalDocx = async (
  deal: DealOpportunity,
  loi: LOITerms | null,
  profile: InvestorProfile,
  financialStructureMarkdown?: string
): Promise<Blob> => {
  const companyName = deal.name || 'Business Acquisition';
  const dateStr = new Date().toLocaleDateString();
  const brandColor = 'C9A84C'; // Signal Gold

  // Create an array of children for the document
  const documentChildren: any[] = [
    new Paragraph({
      children: [new TextRun({ text: "FINANCIAL STRUCTURE PROPOSAL", bold: true, size: 40, color: brandColor, font: "Arial" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440, after: 480 }
    }),
    new Paragraph({
      children: [new TextRun({ text: companyName, bold: true, size: 32, font: "Arial" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 960 }
    }),
    new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_1
    }),
    new Paragraph({
      text: `This document outlines the proposed financial structure and capital stack for the acquisition of ${companyName}.`,
      spacing: { after: 240 }
    })
  ];

  // If we have AI-generated markdown, parse and append it
  if (financialStructureMarkdown && financialStructureMarkdown.trim().length > 0) {
    const lines = financialStructureMarkdown.split('\n');
    let isInList = false;

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      if (cleanLine.startsWith('# ')) {
        documentChildren.push(new Paragraph({
          text: cleanLine.replace('# ', '').replace(/\*\*/g, ''),
          heading: HeadingLevel.HEADING_1
        }));
      } else if (cleanLine.startsWith('## ')) {
        documentChildren.push(new Paragraph({
          text: cleanLine.replace('## ', '').replace(/\*\*/g, ''),
          heading: HeadingLevel.HEADING_2
        }));
      } else if (cleanLine.startsWith('### ')) {
        documentChildren.push(new Paragraph({
          text: cleanLine.replace('### ', '').replace(/\*\*/g, ''),
          heading: HeadingLevel.HEADING_2
        }));
      } else if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        const text = cleanLine.substring(2);
        const parts = text.split('**');
        const runs = parts.map((part, index) => {
          return new TextRun({ text: part, bold: index % 2 !== 0 });
        });
        documentChildren.push(new Paragraph({
          children: runs,
          bullet: { level: 0 }
        }));
      } else {
        // Normal paragraph with basic bold handling
        const parts = cleanLine.split('**');
        const runs = parts.map((part, index) => {
          return new TextRun({ text: part, bold: index % 2 !== 0 });
        });
        documentChildren.push(new Paragraph({
          children: runs,
          spacing: { after: 120 }
        }));
      }
    }
  } else {
    // Fallback to the generic data if the Capital Raising box hasn't been generated
    documentChildren.push(
      new Paragraph({
        text: "Deal Overview",
        heading: HeadingLevel.HEADING_2
      }),
      new Paragraph({
        text: `Purchase Price: $${(loi?.purchasePrice || deal.askingPrice || 0).toLocaleString()}`
      }),
      new Paragraph({
        text: `Current Cash Flow / SDE: $${(deal.sde || deal.revenue || 150000).toLocaleString()}`
      }),
      new Paragraph({
        text: "Capital Stack & Required Raise",
        heading: HeadingLevel.HEADING_1
      }),
      new Paragraph({
        text: "We are raising capital through a structured private money loan and equity syndication to cover the acquisition costs, working capital, and closing fees."
      }),
      new Paragraph({
        text: "Projected Returns",
        heading: HeadingLevel.HEADING_1
      }),
      new Paragraph({
        text: "Based on our financial models, the anticipated cash-on-cash returns and final exit waterfall show strong alignment for all equity and debt partners."
      })
    );
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        { 
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: brandColor },
          paragraph: { spacing: { before: 240, after: 120 } } 
        },
        { 
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: "1A1A1A" },
          paragraph: { spacing: { before: 180, after: 100 } } 
        },
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "[COMPANY LOGO HERE - Replace with your logo]",
                  font: "Arial",
                  size: 20,
                  color: "999999",
                  italics: true
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 }
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "ACQUISITION EDGE", bold: true, font: "Arial", size: 20 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 }
            }),
            new Paragraph({
              children: [new TextRun({ text: dateStr, font: "Arial", size: 18 })],
              alignment: AlignmentType.CENTER
            })
          ]
        })
      },
      children: documentChildren
    }]
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
};

export const generateDealProposalExcel = async (
  deal: DealOpportunity,
  loi: LOITerms | null,
  profile: InvestorProfile,
  financialStructureMarkdown?: string
): Promise<Blob> => {
  const wb = new ExcelJS.Workbook();
  
  // Brand colors
  const colors = {
    header_bg: 'FF1A1A1A',
    header_text: 'FFC9A84C', // Signal Gold
    subheader_bg: 'FF2D2D2D',
    success_green: 'FF00B050',
    input_blue: 'FF0000FF'
  };

  // Helper styles
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.header_bg } };
  const headerFont: ExcelJS.Font = { color: { argb: colors.header_text }, bold: true, size: 14, name: 'Arial' };
  
  const subheaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.subheader_bg } };
  const subheaderFont: ExcelJS.Font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11, name: 'Arial' };
  
  const blueInputFont: ExcelJS.Font = { color: { argb: colors.input_blue }, size: 10, name: 'Arial' };
  const greenFont: ExcelJS.Font = { color: { argb: colors.success_green }, bold: true, size: 11, name: 'Arial' };

  // --- Sheet 1: Deal Summary ---
  const ws1 = wb.addWorksheet('Deal Summary');
  
  ws1.getCell('A1').value = 'ACQUISITION EDGE';
  ws1.getCell('A1').font = { color: { argb: colors.header_text }, bold: true, size: 18, name: 'Arial' };
  
  ws1.getCell('A2').value = 'Deal Structure Proposal';
  ws1.getCell('A2').font = { size: 12, name: 'Arial' };
  
  ws1.getCell('A3').value = deal.name || 'Business Acquisition';
  ws1.getCell('A3').font = { bold: true, size: 14, name: 'Arial' };
  
  ws1.getCell('A4').value = `Generated: ${new Date().toLocaleDateString()}`;
  ws1.getCell('A4').font = { size: 9, italic: true, name: 'Arial' };

  ws1.getCell('A6').value = 'DEAL OVERVIEW';
  ws1.getCell('A6').fill = headerFill;
  ws1.getCell('A6').font = headerFont;
  ws1.mergeCells('A6:D6');

  const parseNumber = (val: any, fallback: number = 0) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      // Find the first occurrence of a number pattern (like "$10,000" or "1000")
      const match = val.match(/[\d,]+(\.\d+)?/);
      if (match) {
          const parsed = parseFloat(match[0].replace(/,/g, ''));
          if (!isNaN(parsed)) return parsed;
      }
    }
    return fallback;
  };

  const strPurchase = String(loi?.purchasePrice || deal?.askingPrice || '');
  const purchasePriceNum = parseNumber(strPurchase, deal?.askingPrice || 0);
  
  let emdAmount = 1000;
  if (loi?.earnestMoney) {
    emdAmount = parseNumber(loi.earnestMoney, 1000);
  }

  // Parse markdown for any mention of acquisition fee and Gator terms to be smarter
  let acqFee = purchasePriceNum * 0.02; // Default 2%
  if (financialStructureMarkdown) {
      const matchAcq = financialStructureMarkdown.match(/acquisition fee.*?\$?([0-9,]+)/i);
      if (matchAcq && matchAcq[1]) {
          acqFee = parseNumber(matchAcq[1], acqFee);
      }
  }

  ws1.getCell('A7').value = 'Purchase Price';
  ws1.getCell('B7').value = purchasePriceNum;
  ws1.getCell('B7').numFmt = '$#,##0';
  ws1.getCell('B7').font = blueInputFont;

  const assetValue = deal.assetsValue || 0;
  ws1.getCell('C7').value = 'Asset Value (FF&E + Inventory)';
  ws1.getCell('D7').value = assetValue;
  ws1.getCell('D7').numFmt = '$#,##0';
  ws1.getCell('D7').font = blueInputFont;

  const closingCosts = 25000;
  ws1.getCell('A8').value = 'Closing Costs / Working Capital';
  ws1.getCell('B8').value = closingCosts;
  ws1.getCell('B8').numFmt = '$#,##0';
  ws1.getCell('B8').font = blueInputFont;

  ws1.getCell('C8').value = 'Asset Arbitrage Discount';
  ws1.getCell('D8').value = assetValue > 0 ? (assetValue - purchasePriceNum) / assetValue : 0;
  ws1.getCell('D8').numFmt = '0.0%';

  ws1.getCell('A9').value = 'Total Capital Required';
  ws1.getCell('B9').value = { formula: 'B7+B8' };
  ws1.getCell('B9').numFmt = '$#,##0';
  ws1.getCell('B9').font = { bold: true, size: 10, name: 'Arial' };

  if (deal.realEstateValue) {
    ws1.getCell('C9').value = 'Real Estate Option Strike';
    ws1.getCell('D9').value = deal.realEstateValue;
    ws1.getCell('D9').numFmt = '$#,##0';
    ws1.getCell('D9').font = blueInputFont;
  }

  // Capital Stack
  ws1.getCell('A11').value = 'CAPITAL STACK';
  ws1.getCell('A11').fill = headerFill;
  ws1.getCell('A11').font = headerFont;
  ws1.mergeCells('A11:D11');

  ['Source', 'Amount', 'Terms', 'Security'].forEach((header, idx) => {
    const cell = ws1.getCell(12, idx + 1);
    cell.value = header;
    cell.fill = subheaderFill;
    cell.font = subheaderFont;
  });

  const capitalStack = await parseCapitalStackFromMarkdown(
    financialStructureMarkdown || '', 
    emdAmount, 
    acqFee, 
    purchasePriceNum, 
    closingCosts
  );

  let row = 13;
  const totalFormulaParts = [];
  capitalStack.forEach(item => {
    ws1.getCell(`A${row}`).value = item.source;
    const amountCell = ws1.getCell(`B${row}`);
    amountCell.value = item.amount;
    amountCell.numFmt = '$#,##0';
    amountCell.font = blueInputFont;
    ws1.getCell(`C${row}`).value = item.terms;
    ws1.getCell(`D${row}`).value = item.security;
    totalFormulaParts.push(`B${row}`);
    row++;
  });

  ws1.getCell(`A${row}`).value = 'TOTAL RAISE';
  ws1.getCell(`B${row}`).value = { formula: `SUM(${totalFormulaParts.join(',')})` };
  ws1.getCell(`B${row}`).numFmt = '$#,##0';
  ws1.getCell(`B${row}`).font = { bold: true, size: 11, name: 'Arial' };

  ws1.getColumn('A').width = 28;
  ws1.getColumn('B').width = 16;
  ws1.getColumn('C').width = 28;
  ws1.getColumn('D').width = 24;

  // --- Sheet 2: Cash Flow Analysis ---
  const ws2 = wb.addWorksheet('Cash Flow Analysis');
  
  ws2.getCell('A1').value = 'CASH FLOW ANALYSIS';
  ws2.getCell('A1').fill = headerFill;
  ws2.getCell('A1').font = headerFont;
  ws2.mergeCells('A1:B1');

  ws2.getCell('A3').value = 'OPERATING ASSUMPTIONS';
  ws2.getCell('A3').fill = subheaderFill;
  ws2.getCell('A3').font = subheaderFont;
  ws2.mergeCells('A3:B3');

  const sde = deal.sde || deal.revenue || 150000;
  ws2.getCell('A4').value = 'Current SDE';
  ws2.getCell('B4').value = sde;
  ws2.getCell('B4').numFmt = '$#,##0';
  ws2.getCell('B4').font = blueInputFont;

  const managerSalary = 70000;
  ws2.getCell('A5').value = 'Operations Manager Salary';
  ws2.getCell('B5').value = managerSalary;
  ws2.getCell('B5').numFmt = '$#,##0';
  ws2.getCell('B5').font = blueInputFont;

  ws2.getCell('A6').value = 'Adjusted EBITDA';
  ws2.getCell('B6').value = { formula: 'B4-B5' };
  ws2.getCell('B6').numFmt = '$#,##0';
  ws2.getCell('B6').font = { bold: true, size: 10, name: 'Arial' };

  ws2.getCell('A8').value = 'ANNUAL DEBT SERVICE';
  ws2.getCell('A8').fill = subheaderFill;
  ws2.getCell('A8').font = subheaderFont;
  ws2.mergeCells('A8:B8');

  let debtService: any[] = [];
  const debtItems = capitalStack.filter((item: any) => item.type === 'debt' || String(item.source).toLowerCase().includes('lender') || String(item.terms).includes('%'));
  
  if (debtItems.length > 0) {
    debtItems.forEach((item: any) => {
      // Find a percentage in the terms
      const match = String(item.terms).match(/(\d+(?:\.\d+)?)%/);
      let rate = 0.12; // default 12%
      if (match && match[1]) {
        rate = parseFloat(match[1]) / 100;
      }
      debtService.push({
        label: `${item.source} Debt Service`,
        annual_amount: (item.amount || purchasePriceNum * 0.5) * rate
      });
    });
  } else {
    debtService = [
      { label: 'PML Debt Service (12%)', annual_amount: purchasePriceNum * 0.5 * 0.12 }
    ];
  }

  // Also add Preferred Return if there is an equity item with preferred return
  const equityItems = capitalStack.filter((item: any) => item.type === 'equity' || String(item.source).toLowerCase().includes('equity'));
  if (equityItems.length > 0) {
    equityItems.forEach((item: any) => {
      const prefMatch = String(item.terms).match(/(\d+(?:\.\d+)?)%\s*pref/i);
      if (prefMatch && prefMatch[1]) {
        const rate = parseFloat(prefMatch[1]) / 100;
        debtService.push({
          label: `${item.source} Preferred Return`,
          annual_amount: item.amount * rate
        });
      }
    });
  } else {
    // If no equity items parsed, put default
    debtService.push({ label: 'Investor Preferred Return (10%)', annual_amount: purchasePriceNum * 0.5 * 0.10 });
  }

  row = 9;
  const debtCells = [];
  debtService.forEach(debt => {
    ws2.getCell(`A${row}`).value = debt.label;
    ws2.getCell(`B${row}`).value = debt.annual_amount;
    ws2.getCell(`B${row}`).numFmt = '$#,##0';
    ws2.getCell(`B${row}`).font = blueInputFont;
    debtCells.push(`B${row}`);
    row++;
  });

  ws2.getCell(`A${row}`).value = 'Total Annual Obligations';
  ws2.getCell(`B${row}`).value = { formula: `SUM(${debtCells.join(',')})` };
  ws2.getCell(`B${row}`).numFmt = '$#,##0';
  const totalObligationsRow = row;
  row += 2;

  ws2.getCell(`A${row}`).value = 'NET DISTRIBUTABLE CASH FLOW';
  ws2.getCell(`A${row}`).fill = subheaderFill;
  ws2.getCell(`A${row}`).font = subheaderFont;
  ws2.mergeCells(`A${row}:B${row}`);
  row++;

  ws2.getCell(`A${row}`).value = 'Annual EBITDA';
  ws2.getCell(`B${row}`).value = { formula: 'B6' };
  ws2.getCell(`B${row}`).numFmt = '$#,##0';
  row++;

  ws2.getCell(`A${row}`).value = 'Less: Total Obligations';
  ws2.getCell(`B${row}`).value = { formula: `-B${totalObligationsRow}` };
  ws2.getCell(`B${row}`).numFmt = '$#,##0';
  row++;

  ws2.getCell(`A${row}`).value = 'Net Distributable Cash Flow';
  ws2.getCell(`B${row}`).value = { formula: `B${row-2}+B${row-1}` };
  ws2.getCell(`B${row}`).numFmt = '$#,##0';
  ws2.getCell(`B${row}`).font = { bold: true, size: 11, name: 'Arial' };
  const netCfRow = row;
  row += 2;

  const dist = { gp_pct: 0.40, lp_pct: 0.60 };
  ws2.getCell(`A${row}`).value = 'DISTRIBUTION SPLIT';
  ws2.getCell(`A${row}`).fill = subheaderFill;
  ws2.getCell(`A${row}`).font = subheaderFont;
  ws2.mergeCells(`A${row}:B${row}`);
  row++;

  ws2.getCell(`A${row}`).value = `GP Share (${dist.gp_pct * 100}%)`;
  ws2.getCell(`B${row}`).value = { formula: `B${netCfRow}*${dist.gp_pct}` };
  ws2.getCell(`B${row}`).numFmt = '$#,##0';
  const gpAnnualRow = row;
  row++;

  ws2.getCell(`A${row}`).value = `LP Share (${dist.lp_pct * 100}%)`;
  ws2.getCell(`B${row}`).value = { formula: `B${netCfRow}*${dist.lp_pct}` };
  ws2.getCell(`B${row}`).numFmt = '$#,##0';
  const lpAnnualRow = row;
  row += 2;

  ws2.getCell(`A${row}`).value = 'MONTHLY CASH FLOW';
  ws2.getCell(`A${row}`).fill = subheaderFill;
  ws2.getCell(`A${row}`).font = subheaderFont;
  ws2.mergeCells(`A${row}:B${row}`);
  row++;

  ws2.getCell(`A${row}`).value = 'GP Monthly Income';
  ws2.getCell(`B${row}`).value = { formula: `B${gpAnnualRow}/12` };
  ws2.getCell(`B${row}`).numFmt = '$#,##0';
  row++;

  ws2.getCell(`A${row}`).value = 'LP Monthly Distributions';
  ws2.getCell(`B${row}`).value = { formula: `B${lpAnnualRow}/12` };
  ws2.getCell(`B${row}`).numFmt = '$#,##0';

  ws2.getColumn('A').width = 35;
  ws2.getColumn('B').width = 16;

  // --- Sheet 3: Exit Waterfall ---
  const ws3 = wb.addWorksheet('Exit Waterfall');
  
  ws3.getCell('A1').value = 'EXIT WATERFALL ANALYSIS - YEAR 7';
  ws3.getCell('A1').fill = headerFill;
  ws3.getCell('A1').font = headerFont;
  ws3.mergeCells('A1:C1');

  ws3.getCell('A3').value = 'EXIT ASSUMPTIONS';
  ws3.getCell('A3').fill = subheaderFill;
  ws3.getCell('A3').font = subheaderFont;
  ws3.mergeCells('A3:C3');

  row = 4;
  ws3.getCell(`A${row}`).value = 'Business Valuation';
  ws3.getCell(`B${row}`).value = 'Multiple';
  ws3.getCell(`C${row}`).value = 'Value';
  row++;

  ws3.getCell(`A${row}`).value = 'Projected EBITDA';
  ws3.getCell(`B${row}`).value = sde;
  ws3.getCell(`B${row}`).numFmt = '$#,##0';
  ws3.getCell(`B${row}`).font = blueInputFont;
  const ebitdaRow = row;
  row++;

  ws3.getCell(`A${row}`).value = 'EBITDA Multiple';
  ws3.getCell(`B${row}`).value = 4.0;
  ws3.getCell(`B${row}`).numFmt = '0.0x';
  ws3.getCell(`B${row}`).font = blueInputFont;
  const multipleRow = row;
  row++;

  ws3.getCell(`A${row}`).value = 'Business Value';
  ws3.getCell(`C${row}`).value = { formula: `B${ebitdaRow}*B${multipleRow}` };
  ws3.getCell(`C${row}`).numFmt = '$#,##0';
  ws3.getCell(`C${row}`).font = { bold: true, size: 10, name: 'Arial' };
  const bizValueRow = row;
  row += 2;

  let totalExitRow = bizValueRow;
  if (deal.realEstateValue) {
    ws3.getCell(`A${row}`).value = 'Real Estate Valuation';
    row++;

    ws3.getCell(`A${row}`).value = 'Current Value';
    ws3.getCell(`B${row}`).value = deal.realEstateValue;
    ws3.getCell(`B${row}`).numFmt = '$#,##0';
    ws3.getCell(`B${row}`).font = blueInputFont;
    const reCurrentRow = row;
    row++;

    ws3.getCell(`A${row}`).value = 'Annual Appreciation';
    ws3.getCell(`B${row}`).value = 0.04;
    ws3.getCell(`B${row}`).numFmt = '0.0%';
    ws3.getCell(`B${row}`).font = blueInputFont;
    const appreciationRow = row;
    row++;

    ws3.getCell(`A${row}`).value = 'Years';
    ws3.getCell(`B${row}`).value = 7;
    ws3.getCell(`B${row}`).font = blueInputFont;
    const yearsRow = row;
    row++;

    ws3.getCell(`A${row}`).value = 'Projected RE Value';
    ws3.getCell(`C${row}`).value = { formula: `B${reCurrentRow}*(1+B${appreciationRow})^B${yearsRow}` };
    ws3.getCell(`C${row}`).numFmt = '$#,##0';
    ws3.getCell(`C${row}`).font = { bold: true, size: 10, name: 'Arial' };
    const reValueRow = row;
    row += 2;

    ws3.getCell(`A${row}`).value = 'TOTAL EXIT VALUE';
    ws3.getCell(`C${row}`).value = { formula: `C${bizValueRow}+C${reValueRow}` };
    ws3.getCell(`C${row}`).numFmt = '$#,##0';
    ws3.getCell(`C${row}`).font = { bold: true, size: 12, color: { argb: colors.header_text }, name: 'Arial' };
    totalExitRow = row;
  } else {
    ws3.getCell(`A${row}`).value = 'TOTAL EXIT VALUE';
    ws3.getCell(`C${row}`).value = { formula: `C${bizValueRow}` };
    ws3.getCell(`C${row}`).numFmt = '$#,##0';
    ws3.getCell(`C${row}`).font = { bold: true, size: 12, color: { argb: colors.header_text }, name: 'Arial' };
    totalExitRow = row;
  }
  row += 2;

  ws3.getCell(`A${row}`).value = 'WATERFALL DISTRIBUTION';
  ws3.getCell(`A${row}`).fill = subheaderFill;
  ws3.getCell(`A${row}`).font = subheaderFont;
  ws3.mergeCells(`A${row}:C${row}`);
  row++;

  ['Priority', 'Payee', 'Amount'].forEach((col, idx) => {
    const cell = ws3.getCell(row, idx + 1);
    cell.value = col;
    cell.fill = subheaderFill;
    cell.font = subheaderFont;
  });
  row++;

  let waterfall: any[] = [];
  if (debtItems.length > 0) {
    waterfall.push({ payee: 'Senior Debt Payoff', amount: debtItems.reduce((acc, curr) => acc + (curr.amount || 0), 0) });
  } else {
    waterfall.push({ payee: 'Senior Debt Payoff', amount: purchasePriceNum * 0.8 });
  }

  if (equityItems.length > 0) {
    waterfall.push({ payee: 'Return Equity Partner Capital', amount: equityItems.reduce((acc, curr) => acc + (curr.amount || 0), 0) });
  } else {
    if (capitalStack[3] && capitalStack[3].amount) {
      waterfall.push({ payee: 'Return Equity Partner Capital', amount: capitalStack[3].amount });
    }
  }

  let priority = 1;
  const waterfallDeductions = [];
  waterfall.forEach(item => {
    ws3.getCell(`A${row}`).value = priority;
    ws3.getCell(`B${row}`).value = item.payee;
    ws3.getCell(`C${row}`).value = item.amount;
    ws3.getCell(`C${row}`).numFmt = '$#,##0';
    if (priority === 1) ws3.getCell(`C${row}`).font = blueInputFont;
    waterfallDeductions.push(`C${row}`);
    priority++;
    row++;
  });

  ws3.getCell(`A${row}`).value = priority;
  ws3.getCell(`B${row}`).value = 'Remaining Proceeds';
  ws3.getCell(`C${row}`).value = { formula: `C${totalExitRow}-${waterfallDeductions.join('-')}` };
  ws3.getCell(`C${row}`).numFmt = '$#,##0';
  const remainingRow = row;
  row += 2;

  let split = { gp_pct: 0.70, lp_pct: 0.30 };
  if (equityItems.length > 0) {
    let lpTotalPct = 0;
    equityItems.forEach((item: any) => {
      const match = String(item.terms).match(/(\d+(?:\.\d+)?)%\s*equity/i);
      if (match && match[1]) {
        lpTotalPct += parseFloat(match[1]) / 100;
      }
    });

    if (lpTotalPct > 0) {
      split = { gp_pct: 1 - lpTotalPct, lp_pct: lpTotalPct };
    }
  }

  ws3.getCell(`A${row}`).value = 'SPLIT OF REMAINING PROCEEDS';
  ws3.getCell(`A${row}`).fill = subheaderFill;
  ws3.getCell(`A${row}`).font = subheaderFont;
  ws3.mergeCells(`A${row}:C${row}`);
  row++;

  ws3.getCell(`A${row}`).value = `GP (${split.gp_pct * 100}%)`;
  ws3.getCell(`C${row}`).value = { formula: `C${remainingRow}*${split.gp_pct}` };
  ws3.getCell(`C${row}`).numFmt = '$#,##0';
  ws3.getCell(`C${row}`).font = greenFont;
  row++;

  ws3.getCell(`A${row}`).value = `LP (${split.lp_pct * 100}%)`;
  ws3.getCell(`C${row}`).value = { formula: `C${remainingRow}*${split.lp_pct}` };
  ws3.getCell(`C${row}`).numFmt = '$#,##0';

  ws3.getColumn('A').width = 35;
  ws3.getColumn('B').width = 25;
  ws3.getColumn('C').width = 18;

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
