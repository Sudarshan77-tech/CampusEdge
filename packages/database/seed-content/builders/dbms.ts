import { QuestionSeed } from './quant';

export const dbmsQuestions: QuestionSeed[] = [
  // 1. Relational Model & Keys
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is a Super Key in a relational database?',
    options: [
      {
        key: 'A',
        text: 'Any set of attributes that uniquely identifies each tuple in a relation',
        isCorrect: true,
      },
      { key: 'B', text: 'A minimal candidate key only', isCorrect: false },
      { key: 'C', text: 'A foreign key that references a primary key', isCorrect: false },
      { key: 'D', text: 'A key that contains no duplicate or null values', isCorrect: false },
    ],
    explanation:
      'A super key is any set of one or more attributes that together uniquely identify a row within a table. A candidate key is a minimal super key.',
    expectedTimeSeconds: 20,
    tags: ['dbms', 'keys'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which constraint enforces referential integrity between two tables in a relational database?',
    options: [
      { key: 'A', text: 'PRIMARY KEY', isCorrect: false },
      { key: 'B', text: 'FOREIGN KEY', isCorrect: true },
      { key: 'C', text: 'UNIQUE', isCorrect: false },
      { key: 'D', text: 'CHECK', isCorrect: false },
    ],
    explanation:
      'A FOREIGN KEY constraint establishes referential integrity by ensuring that the value in the child table references an existing row in the parent table.',
    expectedTimeSeconds: 15,
    tags: ['dbms', 'constraints'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Can a PRIMARY KEY column in a relational database accept NULL values?',
    options: [
      { key: 'A', text: 'Yes, up to one NULL value', isCorrect: false },
      { key: 'B', text: 'Yes, if defined with NULL ALLOWED', isCorrect: false },
      { key: 'C', text: 'No, primary keys are strictly NOT NULL and UNIQUE', isCorrect: true },
      { key: 'D', text: 'Depends on the SQL dialect', isCorrect: false },
    ],
    explanation:
      'By relational database standards, a PRIMARY KEY constraint implicitly enforces both UNIQUE and NOT NULL constraints on the designated columns.',
    expectedTimeSeconds: 15,
    tags: ['dbms', 'primary-key'],
  },

  // 2. Normalization
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'A relation is in First Normal Form (1NF) if and only if:',
    options: [
      {
        key: 'A',
        text: 'All attributes contain only atomic (indivisible) values and there are no repeating groups',
        isCorrect: true,
      },
      { key: 'B', text: 'It has no partial dependencies', isCorrect: false },
      { key: 'C', text: 'It has no transitive dependencies', isCorrect: false },
      { key: 'D', text: 'Every determinant is a candidate key', isCorrect: false },
    ],
    explanation:
      '1NF mandates that table domains contain only indivisible atomic values and that no multivalued or composite attributes or repeating groups exist.',
    expectedTimeSeconds: 25,
    tags: ['normalization', '1nf'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'A relation R is in 2NF if it is in 1NF and:',
    options: [
      {
        key: 'A',
        text: 'No non-prime attribute is partially dependent on any candidate key',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'No non-prime attribute is transitively dependent on candidate keys',
        isCorrect: false,
      },
      { key: 'C', text: 'All functional dependencies are trivial', isCorrect: false },
      { key: 'D', text: 'Multivalued dependencies are eliminated', isCorrect: false },
    ],
    explanation:
      '2NF requires elimination of partial dependencies: every non-prime attribute must depend on the whole candidate key, not a proper subset of a composite candidate key.',
    expectedTimeSeconds: 30,
    tags: ['normalization', '2nf'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'For every non-trivial functional dependency X -> Y in a relation R to satisfy Third Normal Form (3NF), what condition must hold?',
    options: [
      { key: 'A', text: 'X is a superkey OR Y is a prime attribute', isCorrect: true },
      { key: 'B', text: 'X is a candidate key AND Y is a superkey', isCorrect: false },
      { key: 'C', text: 'Y must be a subset of X', isCorrect: false },
      { key: 'D', text: 'R must have only one candidate key', isCorrect: false },
    ],
    explanation:
      '3NF requires that for every non-trivial functional dependency X -> Y, either X is a superkey or Y is a prime attribute (part of some candidate key).',
    expectedTimeSeconds: 35,
    tags: ['normalization', '3nf'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the strict difference between 3NF and Boyce-Codd Normal Form (BCNF)?',
    options: [
      {
        key: 'A',
        text: 'BCNF requires that for every functional dependency X -> Y, X must be a super key (eliminates Y being a prime attribute exception)',
        isCorrect: true,
      },
      { key: 'B', text: '3NF is strictly stronger than BCNF', isCorrect: false },
      { key: 'C', text: 'BCNF deals with multi-valued dependencies', isCorrect: false },
      { key: 'D', text: 'BCNF allows transitive dependencies', isCorrect: false },
    ],
    explanation:
      'In BCNF, the exception where Y is a prime attribute is removed: for EVERY non-trivial dependency X -> Y, X must be a super key. Thus BCNF is strictly stronger than 3NF.',
    expectedTimeSeconds: 35,
    tags: ['normalization', 'bcnf'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 4,
    stem: 'Can every relational schema be decomposed into BCNF while simultaneously preserving all functional dependencies?',
    options: [
      { key: 'A', text: 'Yes, always', isCorrect: false },
      {
        key: 'B',
        text: 'No, BCNF decomposition guarantees lossless join, but does not always guarantee dependency preservation',
        isCorrect: true,
      },
      { key: 'C', text: 'Only if there are composite keys', isCorrect: false },
      { key: 'D', text: 'Only in PostgreSQL', isCorrect: false },
    ],
    explanation:
      'Lossless decomposition into 3NF is always possible with dependency preservation, but BCNF decomposition can sometimes fail to preserve all functional dependencies.',
    expectedTimeSeconds: 40,
    tags: ['normalization', 'bcnf', 'theory'],
  },

  // 3. Transactions & ACID Properties
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which property of ACID guarantees that database transactions are executed entirely or rolled back completely (all-or-nothing)?',
    options: [
      { key: 'A', text: 'Atomicity', isCorrect: true },
      { key: 'B', text: 'Consistency', isCorrect: false },
      { key: 'C', text: 'Isolation', isCorrect: false },
      { key: 'D', text: 'Durability', isCorrect: false },
    ],
    explanation:
      'Atomicity ensures that all operations in a transaction succeed together, or the transaction is aborted and changes undone completely.',
    expectedTimeSeconds: 15,
    tags: ['acid', 'transactions'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which ACID property guarantees that committed transaction changes survive power failures, crashes, and restarts?',
    options: [
      { key: 'A', text: 'Durability', isCorrect: true },
      { key: 'B', text: 'Isolation', isCorrect: false },
      { key: 'C', text: 'Atomicity', isCorrect: false },
      { key: 'D', text: 'Consistency', isCorrect: false },
    ],
    explanation:
      'Durability ensures that once a transaction commits, its modifications are permanently recorded in non-volatile storage (via WAL/flushed pages).',
    expectedTimeSeconds: 15,
    tags: ['acid', 'durability'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a "Dirty Read" concurrency anomaly?',
    options: [
      {
        key: 'A',
        text: 'A transaction reads uncommitted changes written by another concurrent transaction that subsequently rolls back',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'A transaction re-reads a row and finds that values changed after commit',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'A query receives new rows matching a search predicate that were inserted by another transaction',
        isCorrect: false,
      },
      { key: 'D', text: 'A write lock times out', isCorrect: false },
    ],
    explanation:
      'A dirty read occurs when Transaction A reads data modified by Transaction B before Transaction B commits. If B aborts, A has read data that never existed.',
    expectedTimeSeconds: 30,
    tags: ['transactions', 'isolation-levels'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a "Phantom Read" anomaly in database transaction processing?',
    options: [
      {
        key: 'A',
        text: 'A transaction executes a range query twice and finds newly inserted rows committed by a concurrent transaction',
        isCorrect: true,
      },
      { key: 'B', text: 'Reading corrupted data from disk', isCorrect: false },
      { key: 'C', text: 'Updating a row that was already deleted', isCorrect: false },
      { key: 'D', text: 'Reading old cache values', isCorrect: false },
    ],
    explanation:
      'A phantom read occurs when a transaction queries a range of rows twice with the same criteria, but sees additional newly inserted rows committed by another transaction.',
    expectedTimeSeconds: 30,
    tags: ['transactions', 'phantom-reads'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which SQL standard isolation level prevents Dirty Reads and Non-Repeatable Reads, but may still permit Phantom Reads in some engines?',
    options: [
      { key: 'A', text: 'Repeatable Read', isCorrect: true },
      { key: 'B', text: 'Read Committed', isCorrect: false },
      { key: 'C', text: 'Read Uncommitted', isCorrect: false },
      { key: 'D', text: 'Serializable', isCorrect: false },
    ],
    explanation:
      'Under ANSI SQL isolation definitions, Repeatable Read prevents dirty reads and non-repeatable reads, while Serializable prevents all three including phantoms.',
    expectedTimeSeconds: 30,
    tags: ['isolation-levels'],
  },

  // 4. Concurrency Control & Deadlocks
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In the Two-Phase Locking (2PL) protocol, what are the two distinct phases?',
    options: [
      {
        key: 'A',
        text: 'Growing phase (locks acquired, none released) and Shrinking phase (locks released, none acquired)',
        isCorrect: true,
      },
      { key: 'B', text: 'Read phase and Write phase', isCorrect: false },
      { key: 'C', text: 'Commit phase and Abort phase', isCorrect: false },
      { key: 'D', text: 'Validation phase and Execution phase', isCorrect: false },
    ],
    explanation:
      '2PL guarantees serializability by splitting locking into a Growing phase where locks may be acquired but not released, followed by a Shrinking phase where locks can be released but not acquired.',
    expectedTimeSeconds: 30,
    tags: ['2pl', 'concurrency'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is Strict 2PL and what primary advantage does it provide over basic 2PL?',
    options: [
      {
        key: 'A',
        text: 'All exclusive (write) locks are held until transaction commit/abort; it prevents cascading rollbacks',
        isCorrect: true,
      },
      { key: 'B', text: 'It prevents all deadlocks', isCorrect: false },
      { key: 'C', text: 'It requires no shared locks', isCorrect: false },
      { key: 'D', text: 'It allows locks to be reacquired after release', isCorrect: false },
    ],
    explanation:
      'Strict 2PL holds exclusive locks until end-of-transaction (commit/abort), ensuring uncommitted data cannot be read and preventing cascading aborts.',
    expectedTimeSeconds: 35,
    tags: ['strict-2pl', 'concurrency'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 4,
    stem: 'In the Wait-Die deadlock prevention scheme based on transaction timestamps (where smaller timestamp = older transaction):',
    options: [
      {
        key: 'A',
        text: 'If an older transaction requests a resource held by a younger one, the older transaction waits; if a younger transaction requests a resource held by an older one, the younger transaction dies (aborts)',
        isCorrect: true,
      },
      { key: 'B', text: 'Older transactions always abort immediately', isCorrect: false },
      { key: 'C', text: 'Younger transactions always preempt older ones', isCorrect: false },
      { key: 'D', text: 'Deadlocks are detected using a wait-for graph cycle', isCorrect: false },
    ],
    explanation:
      'Wait-Die is a non-preemptive scheme: Old requests Young => Old waits. Young requests Old => Young dies. This ensures wait chains only flow from older to younger, preventing cycles.',
    expectedTimeSeconds: 45,
    tags: ['deadlock-prevention', 'timestamps'],
  },

  // 5. Indexing & Storage Engine
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Why are B+ Trees preferred over B-Trees for database disk indexing?',
    options: [
      {
        key: 'A',
        text: 'All actual data records/pointers are stored exclusively in leaf nodes and leaf nodes are linked sequentially, optimizing range queries and fitting more keys in internal nodes',
        isCorrect: true,
      },
      { key: 'B', text: 'B+ Trees do not require rebalancing', isCorrect: false },
      {
        key: 'C',
        text: 'B+ Trees have lower memory consumption than binary trees',
        isCorrect: false,
      },
      { key: 'D', text: 'B+ Trees do not support binary search', isCorrect: false },
    ],
    explanation:
      'In B+ trees, internal nodes store only search keys (higher fanout, shallow tree), and leaf nodes are linked as a doubly linked list, enabling fast sequential range scans.',
    expectedTimeSeconds: 35,
    tags: ['indexing', 'b-plus-tree'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'How many Clustered Indexes can exist on a single table in a relational database?',
    options: [
      {
        key: 'A',
        text: 'Only 1, because table rows can only be physically ordered in one sequence on disk',
        isCorrect: true,
      },
      { key: 'B', text: 'Up to 16', isCorrect: false },
      { key: 'C', text: 'Unlimited', isCorrect: false },
      { key: 'D', text: '0', isCorrect: false },
    ],
    explanation:
      'A clustered index dictates the physical storage order of rows in the table. Because physical data can only have one physical sort order, only one clustered index can exist per table.',
    expectedTimeSeconds: 20,
    tags: ['indexing', 'clustered-index'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a "Covering Index" in SQL query optimization?',
    options: [
      {
        key: 'A',
        text: 'An index that contains all columns requested by a SELECT query, allowing the engine to return results without accessing the underlying table heap pages',
        isCorrect: true,
      },
      { key: 'B', text: 'An index that covers the entire database schema', isCorrect: false },
      {
        key: 'C',
        text: 'An index built over primary and foreign keys simultaneously',
        isCorrect: false,
      },
      { key: 'D', text: 'A full-text search index', isCorrect: false },
    ],
    explanation:
      'An index is covering when all columns referenced in SELECT, WHERE, and JOIN clauses exist in the index itself, enabling an index-only scan without table lookups.',
    expectedTimeSeconds: 30,
    tags: ['indexing', 'query-optimization'],
  },

  // 6. SQL Queries & Aggregations
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the fundamental difference between the WHERE clause and the HAVING clause in SQL?',
    options: [
      {
        key: 'A',
        text: 'WHERE filters individual rows before grouping; HAVING filters aggregated groups after GROUP BY',
        isCorrect: true,
      },
      { key: 'B', text: 'HAVING is faster than WHERE', isCorrect: false },
      {
        key: 'C',
        text: 'WHERE can use aggregate functions like SUM() and AVG()',
        isCorrect: false,
      },
      { key: 'D', text: 'HAVING can only be used with SELECT *', isCorrect: false },
    ],
    explanation:
      'WHERE evaluates row by row before GROUP BY and cannot contain aggregate functions. HAVING filters aggregated group results produced by GROUP BY.',
    expectedTimeSeconds: 25,
    tags: ['sql', 'having-clause'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the output of the expression `SELECT NULL = NULL` in standard SQL three-valued logic?',
    options: [
      { key: 'A', text: 'UNKNOWN (or NULL)', isCorrect: true },
      { key: 'B', text: 'TRUE', isCorrect: false },
      { key: 'C', text: 'FALSE', isCorrect: false },
      { key: 'D', text: 'Syntax Error', isCorrect: false },
    ],
    explanation:
      'In SQL three-valued logic (3VL), comparing NULL with any value using equality operator = evaluates to UNKNOWN (represented as NULL), requiring the `IS NULL` predicate instead.',
    expectedTimeSeconds: 25,
    tags: ['sql', 'null', 'three-valued-logic'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Given a table `salaries (emp_id INT, amount INT)`, which SQL window function gives consecutive rank numbers without gaps even when duplicate amounts occur?',
    options: [
      { key: 'A', text: 'DENSE_RANK()', isCorrect: true },
      { key: 'B', text: 'RANK()', isCorrect: false },
      { key: 'C', text: 'ROW_NUMBER()', isCorrect: false },
      { key: 'D', text: 'NTILE()', isCorrect: false },
    ],
    explanation:
      'DENSE_RANK() assigns consecutive integer rankings without skips (e.g., 1, 2, 2, 3), whereas RANK() leaves gaps (e.g., 1, 2, 2, 4).',
    expectedTimeSeconds: 25,
    tags: ['sql', 'window-functions'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What does a FULL OUTER JOIN between tables A and B return?',
    options: [
      {
        key: 'A',
        text: 'All rows from A and B, matching rows combined and filling NULLs for non-matching columns on either side',
        isCorrect: true,
      },
      { key: 'B', text: 'Only rows where join condition matches in both', isCorrect: false },
      { key: 'C', text: 'Cartesian product of all rows', isCorrect: false },
      { key: 'D', text: 'Only non-matching rows from both tables', isCorrect: false },
    ],
    explanation:
      'A FULL OUTER JOIN combines the results of both LEFT and RIGHT outer joins, returning all matching rows plus unmatched rows from both sides filled with NULLs.',
    expectedTimeSeconds: 25,
    tags: ['sql', 'joins'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the Write-Ahead Logging (WAL) protocol in relational database engines?',
    options: [
      {
        key: 'A',
        text: 'To ensure log records describing data mutations are written and flushed to durable storage before dirty data pages are flushed to disk',
        isCorrect: true,
      },
      { key: 'B', text: 'To encrypt sensitive database rows', isCorrect: false },
      { key: 'C', text: 'To log all SELECT queries for analytics', isCorrect: false },
      { key: 'D', text: 'To compress database backups', isCorrect: false },
    ],
    explanation:
      'WAL mandates that any change is recorded in append-only durable log storage before corresponding modified memory pages are written to table files, enabling crash recovery via REDO/UNDO.',
    expectedTimeSeconds: 30,
    tags: ['wal', 'crash-recovery'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In PostgreSQL, what mechanism provides multi-version concurrency control (MVCC) without acquiring read locks on rows during SELECT queries?',
    options: [
      {
        key: 'A',
        text: 'Snapshot isolation using xmin and xmax transaction IDs on tuple headers',
        isCorrect: true,
      },
      { key: 'B', text: 'Table-level mutex locks', isCorrect: false },
      { key: 'C', text: 'Automatic row deletion on read', isCorrect: false },
      { key: 'D', text: 'Spinlocks on WAL buffers', isCorrect: false },
    ],
    explanation:
      'PostgreSQL MVCC writes new row versions with header fields xmin (creating transaction) and xmax (deleting/updating transaction), allowing readers to see consistent snapshots without blocking writers.',
    expectedTimeSeconds: 35,
    tags: ['postgresql', 'mvcc'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'If table A has 10 rows and table B has 20 rows, how many rows are produced by a CROSS JOIN (Cartesian product) between A and B?',
    numericAnswer: 200,
    numericTolerance: 0,
    explanation:
      'A CROSS JOIN produces all possible ordered pairs between the two relations: 10 * 20 = 200 rows.',
    expectedTimeSeconds: 15,
    tags: ['sql', 'cross-join'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the SQL standard operator used to combine results of two SELECT queries while eliminating duplicate rows?',
    options: [
      { key: 'A', text: 'UNION', isCorrect: true },
      { key: 'B', text: 'UNION ALL', isCorrect: false },
      { key: 'C', text: 'INTERSECT ALL', isCorrect: false },
      { key: 'D', text: 'JOIN', isCorrect: false },
    ],
    explanation:
      'UNION combines the result sets and performs distinct sorting/hashing to remove duplicates. UNION ALL retains all rows including duplicates.',
    expectedTimeSeconds: 20,
    tags: ['sql', 'set-operations'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which SQL statement is used to remove all rows from a table quickly by deallocating data pages without logging individual row deletions?',
    options: [
      { key: 'A', text: 'TRUNCATE TABLE', isCorrect: true },
      { key: 'B', text: 'DELETE FROM', isCorrect: false },
      { key: 'C', text: 'DROP TABLE', isCorrect: false },
      { key: 'D', text: 'REMOVE TABLE', isCorrect: false },
    ],
    explanation:
      'TRUNCATE is a DDL operation that deallocates data pages rapidly with minimal logging compared to row-by-row DELETE.',
    expectedTimeSeconds: 20,
    tags: ['sql', 'truncate'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the effect of an `ON DELETE CASCADE` clause on a foreign key reference?',
    options: [
      {
        key: 'A',
        text: 'When a row in the parent table is deleted, all matching referencing rows in the child table are automatically deleted',
        isCorrect: true,
      },
      { key: 'B', text: 'Deletions in the parent table are blocked', isCorrect: false },
      { key: 'C', text: 'Foreign key columns are set to NULL', isCorrect: false },
      { key: 'D', text: 'Child table is dropped', isCorrect: false },
    ],
    explanation:
      'ON DELETE CASCADE automatically deletes associated child rows when the referenced row in the parent table is deleted.',
    expectedTimeSeconds: 20,
    tags: ['foreign-keys', 'referential-integrity'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In database recovery, what does the ARIES recovery algorithm perform during its three phases?',
    options: [
      { key: 'A', text: 'Analysis phase, Redo phase, and Undo phase', isCorrect: true },
      { key: 'B', text: 'Scanning phase, Parsing phase, and Execution phase', isCorrect: false },
      { key: 'C', text: 'Lock phase, Validation phase, and Write phase', isCorrect: false },
      { key: 'D', text: 'Replication, Sharding, and Indexing', isCorrect: false },
    ],
    explanation:
      'ARIES executes: 1. Analysis (determines dirty pages and active transactions at crash), 2. Redo (repeats history to reconstruct state), 3. Undo (rolls back uncommitted transactions).',
    expectedTimeSeconds: 35,
    tags: ['dbms-recovery', 'aries'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which relational algebra operation selects rows that satisfy a specified predicate condition?',
    options: [
      { key: 'A', text: 'Selection (sigma)', isCorrect: true },
      { key: 'B', text: 'Projection (pi)', isCorrect: false },
      { key: 'C', text: 'Cartesian product (X)', isCorrect: false },
      { key: 'D', text: 'Join (bowtie)', isCorrect: false },
    ],
    explanation:
      'Selection (denoted by Greek sigma) filters tuples that satisfy a boolean predicate. Projection (pi) selects columns.',
    expectedTimeSeconds: 20,
    tags: ['relational-algebra'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which relational algebra operation selects specified columns/attributes from a relation, dropping duplicates?',
    options: [
      { key: 'A', text: 'Projection (pi)', isCorrect: true },
      { key: 'B', text: 'Selection (sigma)', isCorrect: false },
      { key: 'C', text: 'Intersection', isCorrect: false },
      { key: 'D', text: 'Difference', isCorrect: false },
    ],
    explanation:
      'Projection (pi) filters columns (vertical subset) and eliminates duplicate tuples in pure relational algebra.',
    expectedTimeSeconds: 20,
    tags: ['relational-algebra'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In SQL, what is the result of `COUNT(*)` versus `COUNT(column_name)`?',
    options: [
      {
        key: 'A',
        text: 'COUNT(*) counts all rows including rows with NULLs; COUNT(column_name) counts only rows where column_name is NOT NULL',
        isCorrect: true,
      },
      { key: 'B', text: 'They produce identical counts under all circumstances', isCorrect: false },
      { key: 'C', text: 'COUNT(*) ignores rows with NULLs in primary key', isCorrect: false },
      { key: 'D', text: 'COUNT(column_name) counts distinct values only', isCorrect: false },
    ],
    explanation:
      'COUNT(*) counts total tuples irrespective of NULL contents. COUNT(column_name) excludes NULL values in that specific column.',
    expectedTimeSeconds: 25,
    tags: ['sql', 'aggregate-functions'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What does the SQL clause `EXISTS (subquery)` evaluate to?',
    options: [
      {
        key: 'A',
        text: 'TRUE if the subquery returns at least one row, FALSE otherwise',
        isCorrect: true,
      },
      { key: 'B', text: 'TRUE only if the subquery returns TRUE', isCorrect: false },
      { key: 'C', text: 'The number of rows returned by subquery', isCorrect: false },
      { key: 'D', text: 'NULL if subquery returns empty', isCorrect: false },
    ],
    explanation:
      'EXISTS checks for the existence of rows in the subquery; as soon as a single matching row is found, it short-circuits to TRUE.',
    expectedTimeSeconds: 20,
    tags: ['sql', 'subqueries'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 4,
    stem: 'What is a "Correlated Subquery" in SQL?',
    options: [
      {
        key: 'A',
        text: 'A subquery that references columns from the outer query, causing it to be evaluated conceptually once for each row of the outer query',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'A subquery that executes once and stores results in a temporary table',
        isCorrect: false,
      },
      { key: 'C', text: 'A subquery joined using UNION', isCorrect: false },
      { key: 'D', text: 'A subquery inside a CREATE VIEW statement', isCorrect: false },
    ],
    explanation:
      "A correlated subquery depends on values from the outer query's current row, requiring evaluation in context of each outer tuple.",
    expectedTimeSeconds: 30,
    tags: ['sql', 'subqueries'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which type of index is most suitable for columns with low cardinality (few distinct values such as status or gender) in data warehouses?',
    options: [
      { key: 'A', text: 'Bitmap Index', isCorrect: true },
      { key: 'B', text: 'B-Tree Index', isCorrect: false },
      { key: 'C', text: 'Hash Index', isCorrect: false },
      { key: 'D', text: 'Spatial R-Tree Index', isCorrect: false },
    ],
    explanation:
      'Bitmap indexes represent distinct values with bit vectors, enabling rapid bitwise boolean operations for low-cardinality attributes.',
    expectedTimeSeconds: 25,
    tags: ['indexing', 'bitmap-index'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the role of the database Query Optimizer?',
    options: [
      {
        key: 'A',
        text: 'To analyze parsed relational algebra expressions and select an execution plan with the lowest estimated cost using table statistics',
        isCorrect: true,
      },
      { key: 'B', text: 'To reformat SQL queries to look prettier', isCorrect: false },
      { key: 'C', text: 'To delete unused indexes automatically', isCorrect: false },
      { key: 'D', text: 'To compress table data during idle hours', isCorrect: false },
    ],
    explanation:
      'The query optimizer evaluates alternative physical access paths (index scan, sequential scan, hash join, nested loop) using cost models and data distribution statistics to pick the optimal execution plan.',
    expectedTimeSeconds: 30,
    tags: ['dbms', 'query-optimizer'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of an SQL VIEW?',
    options: [
      {
        key: 'A',
        text: 'A virtual table based on the result-set of an SQL statement, providing security, abstraction, and simplified queries without duplicating data',
        isCorrect: true,
      },
      { key: 'B', text: 'A physical duplicate of a table created for backup', isCorrect: false },
      { key: 'C', text: 'A graphical user interface tool', isCorrect: false },
      { key: 'D', text: 'A temporary index', isCorrect: false },
    ],
    explanation:
      'A view is a stored query definition that appears as a virtual table, abstracting complexity and restricting access to specific columns/rows.',
    expectedTimeSeconds: 25,
    tags: ['sql', 'views'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a Materialized View?',
    options: [
      {
        key: 'A',
        text: 'A view whose query result is physically persisted on disk and must be refreshed periodically or incrementally',
        isCorrect: true,
      },
      { key: 'B', text: 'A standard virtual view', isCorrect: false },
      { key: 'C', text: 'A view that can never be updated', isCorrect: false },
      { key: 'D', text: 'A view with only one column', isCorrect: false },
    ],
    explanation:
      'A materialized view physically stores the computed query result on disk, giving fast read performance at the expense of needing refresh operations when underlying tables mutate.',
    expectedTimeSeconds: 25,
    tags: ['sql', 'materialized-views'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is Database Sharding?',
    options: [
      {
        key: 'A',
        text: 'Horizontal partitioning of a database where rows are divided across multiple independent physical database instances',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Vertical partitioning where columns are divided across instances',
        isCorrect: false,
      },
      { key: 'C', text: 'Creating read replicas', isCorrect: false },
      { key: 'D', text: 'Compressing database tables', isCorrect: false },
    ],
    explanation:
      'Sharding partitions rows across multiple autonomous database servers using a shard key, enabling horizontal scalability beyond single-node limits.',
    expectedTimeSeconds: 25,
    tags: ['scaling', 'sharding'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which constraint ensures that all values in a specific column are strictly greater than zero?',
    options: [
      { key: 'A', text: 'CHECK (column_name > 0)', isCorrect: true },
      { key: 'B', text: 'UNIQUE (column_name > 0)', isCorrect: false },
      { key: 'C', text: 'NOT NULL', isCorrect: false },
      { key: 'D', text: 'DEFAULT 0', isCorrect: false },
    ],
    explanation:
      'The CHECK constraint validates that all values in a column satisfy a boolean condition expression.',
    expectedTimeSeconds: 15,
    tags: ['sql', 'constraints'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What happens when an unindexed column is queried in a WHERE clause of a table with 10 million rows?',
    options: [
      {
        key: 'A',
        text: 'The query engine performs a sequential scan (table scan), reading every block from disk',
        isCorrect: true,
      },
      { key: 'B', text: 'The query fails with an error', isCorrect: false },
      {
        key: 'C',
        text: 'The engine creates a temporary index automatically and keeps it',
        isCorrect: false,
      },
      { key: 'D', text: 'The query returns instantly via cache', isCorrect: false },
    ],
    explanation:
      'Without an applicable index, the database engine must scan all data pages sequentially to evaluate the WHERE predicate for every tuple.',
    expectedTimeSeconds: 25,
    tags: ['query-performance', 'sequential-scan'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the SQL statement `COMMIT`?',
    options: [
      {
        key: 'A',
        text: 'To permanently save all changes made during the current transaction',
        isCorrect: true,
      },
      { key: 'B', text: 'To cancel changes made during the current transaction', isCorrect: false },
      { key: 'C', text: 'To create a savepoint', isCorrect: false },
      { key: 'D', text: 'To lock the table indefinitely', isCorrect: false },
    ],
    explanation:
      'COMMIT makes all modifications made during the transaction permanent and visible to other transactions, releasing locks.',
    expectedTimeSeconds: 15,
    tags: ['transactions', 'commit'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the SQL statement `ROLLBACK`?',
    options: [
      {
        key: 'A',
        text: 'To undo and abort all changes made in the current uncommitted transaction',
        isCorrect: true,
      },
      { key: 'B', text: 'To restart the database server', isCorrect: false },
      { key: 'C', text: 'To delete committed data', isCorrect: false },
      { key: 'D', text: 'To drop a foreign key', isCorrect: false },
    ],
    explanation:
      'ROLLBACK reverts all uncommitted modifications back to the start of the transaction or to a designated SAVEPOINT.',
    expectedTimeSeconds: 15,
    tags: ['transactions', 'rollback'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In PostgreSQL, what command physically removes dead tuple rows left behind by MVCC updates and deletes, reclaiming disk space?',
    options: [
      { key: 'A', text: 'VACUUM', isCorrect: true },
      { key: 'B', text: 'REINDEX', isCorrect: false },
      { key: 'C', text: 'OPTIMIZE', isCorrect: false },
      { key: 'D', text: 'CLEANUP', isCorrect: false },
    ],
    explanation:
      'VACUUM scans tables for dead rows created by updates and deletes, freeing their space for new tuples and updating table statistics.',
    expectedTimeSeconds: 20,
    tags: ['postgresql', 'vacuum'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which SQL operator is used to search for a specified pattern in a column using wildcards (% and _)?',
    options: [
      { key: 'A', text: 'LIKE', isCorrect: true },
      { key: 'B', text: 'CONTAINS', isCorrect: false },
      { key: 'C', text: 'IN', isCorrect: false },
      { key: 'D', text: 'MATCH', isCorrect: false },
    ],
    explanation:
      'LIKE evaluates pattern matching where % represents zero or more characters and _ represents a single character.',
    expectedTimeSeconds: 15,
    tags: ['sql', 'pattern-matching'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a Database Trigger in SQL?',
    options: [
      {
        key: 'A',
        text: 'A stored procedure that is automatically executed when a specific event (INSERT, UPDATE, DELETE) occurs on a table',
        isCorrect: true,
      },
      { key: 'B', text: 'A tool for initiating database backups', isCorrect: false },
      { key: 'C', text: 'A script that restarts the database server', isCorrect: false },
      { key: 'D', text: 'A constraint that checks foreign keys', isCorrect: false },
    ],
    explanation:
      'A trigger is a procedural code block attached to a table that executes automatically before or after DML events occur.',
    expectedTimeSeconds: 20,
    tags: ['sql', 'triggers'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of an EXPLAIN ANALYZE statement in PostgreSQL?',
    options: [
      {
        key: 'A',
        text: 'It executes the query, records actual runtime metrics (time, row counts, memory), and displays the execution plan compared with planner estimates',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'It analyzes disk fragmentation without running queries',
        isCorrect: false,
      },
      { key: 'C', text: 'It performs static linting on SQL query syntax', isCorrect: false },
      { key: 'D', text: 'It generates sample test data', isCorrect: false },
    ],
    explanation:
      'EXPLAIN ANALYZE physically runs the query to display actual startup times, execution times, buffer hits, and actual rows vs estimated rows.',
    expectedTimeSeconds: 30,
    tags: ['postgresql', 'explain-analyze'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What does the SQL standard aggregate function `COALESCE(val1, val2, val3)` return?',
    options: [
      { key: 'A', text: 'The first non-NULL expression in the argument list', isCorrect: true },
      { key: 'B', text: 'The maximum value among arguments', isCorrect: false },
      { key: 'C', text: 'The average of all non-null values', isCorrect: false },
      { key: 'D', text: 'NULL if any value is NULL', isCorrect: false },
    ],
    explanation:
      'COALESCE evaluates arguments sequentially and returns the first argument that is not NULL.',
    expectedTimeSeconds: 20,
    tags: ['sql', 'null-handling'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is Database Normalization primarily intended to minimize?',
    options: [
      {
        key: 'A',
        text: 'Data redundancy and insertion/update/deletion anomalies',
        isCorrect: true,
      },
      { key: 'B', text: 'The number of tables in the database', isCorrect: false },
      { key: 'C', text: 'The number of JOIN operations', isCorrect: false },
      { key: 'D', text: 'Disk cache utilization', isCorrect: false },
    ],
    explanation:
      'Normalization decomposes relations to reduce redundant data and eliminate update, insertion, and deletion anomalies.',
    expectedTimeSeconds: 20,
    tags: ['normalization'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is Denormalization in database design and when is it employed?',
    options: [
      {
        key: 'A',
        text: 'Deliberately introducing controlled redundancy into a normalized schema to improve read performance and avoid expensive JOINs',
        isCorrect: true,
      },
      { key: 'B', text: 'Deleting obsolete indexes', isCorrect: false },
      { key: 'C', text: 'Dropping primary keys to speed up inserts', isCorrect: false },
      { key: 'D', text: 'Reverting database schema to version 1', isCorrect: false },
    ],
    explanation:
      'Denormalization trades off write complexity and storage redundancy to optimize read-heavy workloads by pre-joining or storing aggregated columns.',
    expectedTimeSeconds: 25,
    tags: ['denormalization', 'database-design'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which type of lock allows multiple concurrent transactions to read a resource simultaneously but prevents any transaction from writing to it?',
    options: [
      { key: 'A', text: 'Shared Lock (S lock)', isCorrect: true },
      { key: 'B', text: 'Exclusive Lock (X lock)', isCorrect: false },
      { key: 'C', text: 'Intent Exclusive Lock (IX lock)', isCorrect: false },
      { key: 'D', text: 'Spinlock', isCorrect: false },
    ],
    explanation:
      'Shared (S) locks are compatible with other Shared locks for concurrent reads, but are incompatible with Exclusive (X) write locks.',
    expectedTimeSeconds: 20,
    tags: ['concurrency', 'locks'],
  },
  {
    topicSlug: 'sql-dbms',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the SQL command to create an index on column `email` of table `users` with an enforcement that no duplicate emails exist?',
    options: [
      { key: 'A', text: 'CREATE UNIQUE INDEX idx_users_email ON users(email);', isCorrect: true },
      {
        key: 'B',
        text: 'CREATE INDEX idx_users_email ON users(email) DISTINCT;',
        isCorrect: false,
      },
      { key: 'C', text: 'ADD INDEX UNIQUE users(email);', isCorrect: false },
      { key: 'D', text: 'CREATE PRIMARY INDEX users(email);', isCorrect: false },
    ],
    explanation:
      'CREATE UNIQUE INDEX creates a b-tree index while simultaneously enforcing uniqueness across all indexed values.',
    expectedTimeSeconds: 20,
    tags: ['sql', 'indexing'],
  },
];
