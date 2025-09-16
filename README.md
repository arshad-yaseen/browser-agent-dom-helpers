# Browser Agent DOM Helpers

DOM helpers for the browser agent's LLM processing.

## Clean HTML

```typescript
import { cleanHtml } from './src/clean-html';

const cleanedHtml = await cleanHtml(rawHtml);
```

Cleans and minifies HTML for LLM browser automation by preserving only elements and attributes essential for decision-making (e.g., selectors, navigation, actions), while removing unnecessary content such as styles, layout, and all other extraneous elements, thereby dramatically reducing LLM input tokens.
