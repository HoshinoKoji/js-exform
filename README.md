## Introduction

This project is to develop a Vue 3 single page questionnaire application to be embedded in online psychology experiments. Demo pages are hosted to show how it looks like:
- [Standard](https://js-exform.pages.dev/demo)
- [Dark mode](https://js-exform.pages.dev/demo-dark)
- [Chinese version](https://js-exform.pages.dev/demo-cn)

This project is still under active development and could be very unstable (due to skill issues).

The following parts of the documentation are generated by `Claude-3.7-Sonnet`.

## Data Transport

The questionnaire component receives input via the `window.postMessage` API. The parent window should post a message with the following structure:

```javascript
window.postMessage({
  type: 'spec',
  title: 'Your Questionnaire Title',
  items: [...],  // Array of question items
  settings: {...} // Configuration options
}, '*');
```

## Input Schema

### Root Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Must be 'spec' |
| title | string | Yes | Main title of the questionnaire |
| items | array | Yes | Array of question items |
| settings | object | No | Configuration options |

### Item Object

Each item in the `items` array represents a question with the following structure:

```javascript
{
  type: 'text', // 'text', 'radio', 'checkbox', 'scale', 'display'
  title: 'Question text',
  desc: 'Optional description text with HTML support',
  key: 'unique_identifier', // Optional, defaults to title
  optTexts: ['Option 1', 'Option 2'], // For 'radio', 'checkbox', 'scale'
  optValues: ['value1', 'value2'], // For 'radio', 'checkbox', 'scale'
  required: true, // Whether answer is required
  minOpts: 1, // For 'checkbox', minimum options to select
  maxOpts: 3  // For 'checkbox', maximum options to select
}
```

#### Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Question type: 'text', 'radio', 'checkbox', 'scale', or 'display' |
| title | string | Yes | Question text |
| desc | string | No | Additional descriptive text (supports HTML) |
| key | string | No | Unique identifier (defaults to title if not provided) |
| optTexts | array | Conditional | Array of option texts for 'radio', 'checkbox', 'scale' |
| optValues | array | Conditional | Array of option values for 'radio', 'checkbox', 'scale' |
| required | boolean | No | Whether an answer is required (default: false) |
| minOpts | number | No | Minimum options to select for 'checkbox' (default: 1) |
| maxOpts | number | No | Maximum options to select for 'checkbox' (default: total options) |

### Settings Object

```javascript
{
  allowBack: true,       // Allow navigation to previous questions
  allowAutoNext: true,   // Auto-advance after selection for radio/scale
  darkMode: false,       // Visual theme
  lang: 'en-US'          // Language code
}
```

## Question Types

- **text**: Single-line text input
- **radio**: Single-choice selection with radio buttons
- **checkbox**: Multiple-choice selection with checkboxes
- **scale**: Slider scale with labeled endpoints
- **display**: Information display with no input required

## Response Format

When the questionnaire is completed, the component sends a message to the parent window:

```javascript
{
  type: 'response',
  started: 1646120000000,  // Timestamp when questionnaire started
  ended: 1646121000000,    // Timestamp when questionnaire completed
  results: [
    {
      title: 'Question text',
      key: 'question_key',
      type: 'question_type',
      answer: 'user_response',
      answerText: 'Text representation of response',
      answerValue: 'Value representation of response',
      refilled: false,     // Whether the answer was changed
      responseTime: 5000   // Time spent on question in milliseconds
    },
    // Additional question results...
  ]
}
```

## Examples

Please refer to source code of demo files.

## For developers

To modify or build the component, simply follow the standard routine:

```sh
npm install
npm run dev
npm run build
```