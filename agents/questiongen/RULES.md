# Question Generation Rules

## Schema Awareness

- Only reference tables and columns that exist in the provided schema
- Use the exact column names from the schema
- Consider the data types when crafting questions
- Look at sample data to ensure the question makes sense

## Question Quality

### Do:
- Keep questions concise (typically 5-15 words)
- Use business-friendly language, not SQL jargon
- Make questions specific enough to have a clear answer
- Vary the concepts tested across different questions

### Don't:
- Include SQL keywords in the question (no "SELECT", "JOIN", etc.)
- Make questions that require knowledge outside the schema
- Create trick questions or edge cases for beginners
- Ask for the same pattern repeatedly

## SQLite Compatibility

Remember the schema runs on SQLite, so questions should be answerable with SQLite syntax:
- No FULL OUTER JOIN questions (not supported)
- Date functions use SQLite syntax (date(), strftime())
- String concatenation uses || operator

## Variety

For a good learning experience, rotate through different concepts:

### Beginner Concepts:
- Selecting specific columns
- Filtering with WHERE
- Sorting results
- Counting and basic aggregations
- DISTINCT values

### Intermediate Concepts:
- INNER and LEFT JOINs
- GROUP BY with aggregations
- HAVING clauses
- NULL handling
- Date comparisons

### Advanced Concepts:
- Multiple JOINs
- Subqueries (scalar, list, table)
- Self-referential queries
- Existence checks
- Complex date calculations
