# ROI CashFlow Commander

Welcome to ROI CashFlow Commander, a smart cash flow management application built with Next.js and powered by Firebase and Google's Generative AI. This application helps you manage your finances with an intuitive interface and intelligent features.

## ✨ Features

- **AI-Powered Expense Capture**: Describe your expenses in plain English using the chat interface in the "Capture" tab. The AI will extract details like description, amount, and due date automatically.
- **File-Based Extraction**: Upload documents like invoices or receipts (TXT, PDF, DOC, images) to have the AI extract relevant financial tasks.
- **Interactive Cash Flow Board**: Visualize your income and expenses on a Kanban-style board in the "Cashflow" tab. Items are organized into categories like 'Current Week', 'Next Week', 'Overdue', and more.
- **Recurring Expense Management**: Set up recurring payments in the "Recurring" category and process them automatically into the correct weekly columns at the click of a button.
- **AI Prioritization**: Get AI-driven recommendations on which bills to pay first based on your available funds, savings goals, and payment priorities.
- **Modern UI/UX**: Built with Next.js, React, ShadCN UI components, and Tailwind CSS for a responsive and aesthetically pleasing user experience.

## 🚀 Getting Started

To get started with the application, simply run the development server:

```bash
npm run dev
```

Then, open your browser to `http://localhost:9002` to see the application in action.

### Key Components:

- **`src/app/page.tsx`**: The main entry point for the application, featuring a tabbed interface for "Capture" and "Cashflow".
- **`src/components/capture`**: Contains the components for the AI-powered expense capture feature, including the chat window and file upload.
- **`src/components/cashflow`**: Contains the components for the cash flow board, including the category columns and item cards.
- **`src/ai/flows`**: This directory holds the Genkit flows that power the AI features, such as `extract-expenses.ts` and `prioritize-payments.ts`.

This project is a starter template for Firebase Studio.
