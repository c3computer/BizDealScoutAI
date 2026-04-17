"""
ACQUISITION EDGE - DOCX Proposal Template Generator
Companion to the Excel generator - creates Word document proposals

Usage:
    python create_docx_template.py deal_config.json [logo_path.png]
"""

import json
import sys
import subprocess

def generate_docx_proposal(config, logo_path=None):
    """Generate Word document from config JSON"""
    
    company_name = config['deal_overview']['company_name']
    date = config['deal_overview'].get('date', 'N/A')
    
    # Build JavaScript code for docx generation
    js_code = f'''
const {{ Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        AlignmentType, WidthType, Header, Footer, HeadingLevel{', ImageRun' if logo_path else ''} }} = require('docx');
const fs = require('fs');

const doc = new Document({{
  styles: {{
    default: {{ document: {{ run: {{ font: "Arial", size: 22 }} }} }},
    paragraphStyles: [
      {{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: {{ size: 32, bold: true, font: "Arial", color: "C9A84C" }},
        paragraph: {{ spacing: {{ before: 240, after: 120 }}, outlineLevel: 0 }} }},
      {{ id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: {{ size: 26, bold: true, font: "Arial", color: "1A1A1A" }},
        paragraph: {{ spacing: {{ before: 180, after: 100 }}, outlineLevel: 1 }} }},
    ]
  }},
  sections: [{{
    properties: {{
      page: {{
        size: {{ width: 12240, height: 15840 }},
        margin: {{ top: 1440, right: 1440, bottom: 1440, left: 1440 }}
      }}
    }},
    headers: {{
      default: new Header({{
        children: [
          new Paragraph({{
            children: [
'''

    # Add logo or placeholder
    if logo_path:
        js_code += f'''
              new ImageRun({{
                data: fs.readFileSync("{logo_path}"),
                transformation: {{ width: 200, height: 60 }}
              }})
'''
    else:
        js_code += '''
              new TextRun({{
                text: "[COMPANY LOGO HERE - Upload logo.png]",
                font: "Arial",
                size: 20,
                color: "999999",
                italics: true
              }})
'''

    js_code += f'''
            ],
            alignment: AlignmentType.CENTER,
            spacing: {{ after: 120 }}
          }})
        ]
      }})
    }},
    footers: {{
      default: new Footer({{
        children: [
          new Paragraph({{
            children: [new TextRun({{ text: "ACQUISITION EDGE", bold: true, font: "Arial", size: 20 }})],
            alignment: AlignmentType.CENTER,
            spacing: {{ after: 60 }}
          }}),
          new Paragraph({{
            children: [new TextRun({{ text: "{date}", font: "Arial", size: 18 }})],
            alignment: AlignmentType.CENTER
          }})
        ]
      }})
    }},
    children: [
      new Paragraph({{
        children: [new TextRun({{ text: "FINANCIAL STRUCTURE PROPOSAL", bold: true, size: 40, color: "C9A84C", font: "Arial" }})],
        alignment: AlignmentType.CENTER,
        spacing: {{ before: 1440, after: 480 }}
      }}),
      new Paragraph({{
        children: [new TextRun({{ text: "{company_name}", bold: true, size: 32, font: "Arial" }})],
        alignment: AlignmentType.CENTER,
        spacing: {{ after: 960 }}
      }}),
      // Add rest of content sections here...
      // (Full implementation would include all sections from the detailed template)
    ]
  }}]
}});

Packer.toBuffer(doc).then(buffer => {{
  fs.writeFileSync("{config.get('output_filename', 'Deal_Proposal.docx')}", buffer);
  console.log("DOCX proposal generated successfully");
}});
'''
    
    # Write JS file and execute
    with open('_temp_docx_gen.js', 'w') as f:
        f.write(js_code)
    
    result = subprocess.run(['node', '_temp_docx_gen.js'], capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"Generated: {config.get('output_filename', 'Deal_Proposal.docx')}")
    else:
        print(f"Error: {result.stderr}")
    
    return result.returncode

def main():
    if len(sys.argv) < 2:
        print("Usage: python create_docx_template.py deal_config.json [logo_path.png]")
        sys.exit(1)
    
    with open(sys.argv[1], 'r') as f:
        config = json.load(f)
    
    logo_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    generate_docx_proposal(config, logo_path)

if __name__ == "__main__":
    main()
