# Adding Your Company Logo to Proposals

## Quick Start

### Option 1: Manual Addition (Recommended for one-off edits)
1. Open the generated `.docx` file in Microsoft Word
2. Double-click the header area (top of page)
3. Delete the placeholder text `[COMPANY LOGO HERE]`
4. Insert → Picture → Select your logo file
5. Resize and center the logo as desired
6. Close the header editor

### Option 2: Programmatic Logo Insertion

#### For Node.js/JavaScript Users:

Edit the document generation script to include your logo:

```javascript
// In the headers section, replace the placeholder text with:
new ImageRun({
  data: fs.readFileSync("path/to/your/logo.png"),
  transformation: { 
    width: 200,   // Adjust width in pixels
    height: 60    // Adjust height in pixels
  }
})
```

**Supported formats:** PNG, JPG, JPEG

#### For Python Users:

The `create_docx_template.py` accepts an optional logo parameter:

```bash
python create_docx_template.py deal_config.json path/to/logo.png
```

## Logo Specifications

### Recommended Dimensions:
- **Width:** 150-250 pixels
- **Height:** 40-80 pixels
- **Aspect Ratio:** 2:1 to 4:1 (horizontal logos work best)

### File Requirements:
- **Format:** PNG (preferred for transparency) or JPG
- **Resolution:** 150 DPI minimum for print quality
- **File Size:** Under 500KB recommended
- **Background:** Transparent PNG recommended

### Visual Guidelines:
- Logo should be easily readable when printed
- Avoid overly detailed logos that don't scale well
- Ensure sufficient contrast against white background
- Test print before finalizing

## Header/Footer Pattern

### Current Standard Format:

**HEADER (every page):**
```
[Company Logo - centered]
```

**FOOTER (every page):**
```
ACQUISITION EDGE
April 16, 2026
```

### Customizing the Footer Date:

The date in the footer is pulled from your configuration JSON:

```json
{
  "deal_overview": {
    "date": "4/16/2026"  // Update this value
  }
}
```

## Troubleshooting

### Logo appears too large/small:
- Adjust the `width` and `height` values in the `transformation` object
- Maintain aspect ratio to avoid distortion
- Test with 150x50, 200x60, or 250x75 as starting points

### Logo doesn't appear:
- Verify file path is correct (use absolute paths if needed)
- Check file extension matches actual file type
- Ensure logo file exists before running generation script

### Logo quality is poor:
- Use higher DPI source file (300 DPI for print)
- Export from vector format (SVG, AI) if available
- Ensure PNG has transparent background

### Header spacing issues:
- Adjust `spacing: { after: 120 }` value (in DXA units, 1440 = 1 inch)
- Increase for more whitespace, decrease for tighter layout

## Example Logo Integration

### Full JavaScript Implementation:

```javascript
const fs = require('fs');
const { ImageRun, Header, Paragraph, AlignmentType } = require('docx');

// ... in your document sections:

headers: {
  default: new Header({
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            data: fs.readFileSync("./company_logo.png"),
            transformation: { 
              width: 200, 
              height: 60 
            }
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 }
      })
    ]
  })
}
```

## Brand Consistency Tips

1. **Use the same logo across all materials:**
   - Investor decks
   - Executive summaries
   - Financial models
   - Email signatures

2. **Maintain brand colors:**
   - Primary: Signal Gold (#C9A84C)
   - Background: Obsidian (#1A1A1A)
   - Accent: Match your logo colors

3. **Typography alignment:**
   - Headers: Arial Bold
   - Body: Arial Regular
   - Match font weights to your brand guidelines

## Advanced: Dynamic Logo Per Deal

If generating proposals for different clients/brands:

```json
{
  "branding": {
    "logo_path": "/path/to/client_logo.png",
    "company_name": "Client Company LLC",
    "footer_text": "ACQUISITION EDGE",
    "brand_color": "C9A84C"
  }
}
```

Then reference in your generation script:

```javascript
const logoPath = config.branding.logo_path;
const brandColor = config.branding.brand_color;

// Use dynamic values throughout document
```

## Support

For logo integration issues or custom branding requests:

**Christopher Carwise**  
C4 Infinity LLC  
sales@c4infinity.com  
754-229-9225
