---
title: Table PDF Export
prev:
  text: Excel Export
  link: /guide/excel/excel
next:
  text: Word Export
  link: /guide/word/word
---




## Usage

Here's how you can use the `ExportPDFTable` function in Vue 3

### Importing

```typescript
import { ExportPDFTable } from "vue3-document-exporter";
```

### Function Definition

```typescript
ExportPDFTable(
  filename: string,
  content: Content | Content[], // Accepts single content or array of contents
  attributes?: Attribute
): Promise<void>
```

### Parameters

- **filename** (`string`): The name of the PDF file to be generated (excluding the `.pdf` extension).
- **content** (`Content | Content[]`):  An object (or array of objects) containing the data to be included in the PDF.
  - `data` (`any[]`): An array of objects representing the table data.
  - `columns` (`string[]`): An array of column headers.
  - `logo` (`string`, optional): The URL of the logo image to include in the PDF.
  - `headers` (`string[]`, optional): An array of headers to be added above the table.
  - `logoText` (`string`, optional): Text to display below the logo.
  - `headers` (`string[] | Array<{type: string, content: string[]}>`, optional): An array of headers or boxed headers to be added above the table.
  - `summary` (`Record<string, any>`, optional): Summary row data to be added at the bottom of the table.
  - `title` (`string`, optional): The title to be displayed above the table.
- **attributes** (`Attribute`, optional): An object specifying additional attributes for customizing the PDF.
  - `width` (`number`, optional): The width of the table.
  - `style` (`string`, optional): The style of the table.
  - `font` (`string`, optional): The font to use in the PDF.
  - `fontSize` (`number`, optional): The font size to use.
  - `color` (`string`, optional): The color of the text.
  - `uppercaseTitle` (`boolean`, optional): Whether to convert the title to uppercase.
  - `language` (`"en" | "de" | "fr" | "es" | "pt" | "it" | "ru" | "ja" | "ko" | "zh" | "ar"`, optional): The language to use.
  - `themes` (`"grid" | "striped" | "plain" | "first" | "last"`, optional): The theme of the table.
  - `logoHeight` (`number`, optional): The height of the logo in pixels.
  - `logoWidth` (`number`, optional): The width of the logo in pixels.

### Example

```typescript
const content = {
  data: [
    { name: "John Doe", age: 30, country: "USA" },
    { name: "Jane Smith", age: 25, country: "Canada" }
  ],
  columns: ["Name", "Age", "Country"],
  logo: "https://example.com/logo.png",
  logoText: "Company Name",
  headers: ["Company Report", "Department A"],
  title: "Employee List",
  summary: { Name: "Total", Age: "55", Country: "2 countries" }
};

const attributes = {
  font: "Arial",
  fontSize: 12,
  color: "#333333",
  uppercaseTitle: true,
  themes: "striped",
  logoHeight: 40,
  logoWidth: 40
};

ExportPDFTable("employee-list", content, attributes);
```


