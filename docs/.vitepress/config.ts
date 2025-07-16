import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Vue Document Exporter",
  themeConfig: {
    logo: '/vue.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Usage', link: '/guide/word/word' }
    ],

    sidebar: [
      {
        text: 'Get Started',
        items: [
          { text: 'Installation', link: '/guide/installation/installation' },
        ]
      },
      {
        text: 'Export Types',
        items: [
          { text: 'Word', link: '/guide/word/word' },
          { text: 'Excel', link: '/guide/excel/excel' },
          { text: 'CSV', link: '/guide/csv/csv' },
          { text: 'PDF', link: '/guide/pdf/pdf' },
          { text: 'PDF Table', link: '/guide/tablepdf/tablepdf' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/IdreesAbuEtewy/vue3-document-exporter' },
     
    ]
  }
})