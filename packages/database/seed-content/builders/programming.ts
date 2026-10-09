import { QuestionSeed } from './quant';

export const programmingQuestions: QuestionSeed[] = [
  // 1. Memory Layout: Stack vs Heap
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'In a typical compiled program memory layout, where are local variables and function call frames allocated?',
    options: [
      { key: 'A', text: 'Call Stack', isCorrect: true },
      { key: 'B', text: 'Heap', isCorrect: false },
      { key: 'C', text: 'BSS segment', isCorrect: false },
      { key: 'D', text: 'Code (Text) segment', isCorrect: false },
    ],
    explanation:
      'Local variables, return addresses, and function call frames (activation records) are pushed onto and popped from the call stack automatically in LIFO order.',
    expectedTimeSeconds: 15,
    tags: ['programming', 'memory-layout', 'stack'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Where is dynamically allocated memory (e.g., via `malloc()` in C or `new` in C++/Java) allocated?',
    options: [
      { key: 'A', text: 'Heap', isCorrect: true },
      { key: 'B', text: 'Stack', isCorrect: false },
      { key: 'C', text: 'Data segment', isCorrect: false },
      { key: 'D', text: 'Instruction register', isCorrect: false },
    ],
    explanation:
      'Dynamic memory whose lifetime extends beyond the scope of the allocating function is allocated in the heap segment and managed manually or by a garbage collector.',
    expectedTimeSeconds: 15,
    tags: ['programming', 'memory-layout', 'heap'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a "Dangling Pointer" in C/C++?',
    options: [
      {
        key: 'A',
        text: 'A pointer that continues to point to a memory location after that memory has already been freed or deallocated',
        isCorrect: true,
      },
      { key: 'B', text: 'A pointer initialized to NULL', isCorrect: false },
      { key: 'C', text: 'A pointer to a constant integer', isCorrect: false },
      { key: 'D', text: 'A void pointer that cannot be dereferenced', isCorrect: false },
    ],
    explanation:
      'A dangling pointer references deallocated memory, leading to undefined behavior or security vulnerabilities (use-after-free) if dereferenced.',
    expectedTimeSeconds: 20,
    tags: ['programming', 'pointers', 'dangling-pointer'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a "Memory Leak"?',
    options: [
      {
        key: 'A',
        text: 'When heap-allocated memory is no longer needed by the program but is never released or deallocated, consuming memory over time',
        isCorrect: true,
      },
      { key: 'B', text: 'When a variable overflows its 32-bit integer boundary', isCorrect: false },
      { key: 'C', text: 'When data leaks across network sockets', isCorrect: false },
      { key: 'D', text: 'When stack memory exceeds physical RAM', isCorrect: false },
    ],
    explanation:
      'A memory leak occurs when allocated memory loses all references without being freed, reducing available system memory until process termination.',
    expectedTimeSeconds: 20,
    tags: ['programming', 'memory-leak'],
  },

  // 2. Pointers, References & Smart Pointers
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In modern C++ (C++11 and later), which smart pointer expresses exclusive, non-shareable ownership of a dynamically allocated resource?',
    options: [
      { key: 'A', text: 'std::unique_ptr', isCorrect: true },
      { key: 'B', text: 'std::shared_ptr', isCorrect: false },
      { key: 'C', text: 'std::weak_ptr', isCorrect: false },
      { key: 'D', text: 'std::auto_ptr', isCorrect: false },
    ],
    explanation:
      'std::unique_ptr enforces strict sole ownership via move semantics (cannot be copied, only moved), automatically freeing the owned object on destruction.',
    expectedTimeSeconds: 20,
    tags: ['cpp', 'smart-pointers', 'unique-ptr'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Why is `std::weak_ptr` used in conjunction with `std::shared_ptr` in C++?',
    options: [
      {
        key: 'A',
        text: 'To break cyclic reference dependencies that would otherwise prevent the reference count from reaching 0 and cause memory leaks',
        isCorrect: true,
      },
      { key: 'B', text: 'To make shared_ptr thread-safe', isCorrect: false },
      { key: 'C', text: 'To speed up pointer arithmetic', isCorrect: false },
      { key: 'D', text: 'To allocate weak memory on the stack', isCorrect: false },
    ],
    explanation:
      'Circular references between shared_ptrs prevent reference counts from ever reaching 0. weak_ptr provides a non-owning observer reference without incrementing reference count.',
    expectedTimeSeconds: 30,
    tags: ['cpp', 'smart-pointers', 'weak-ptr'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is RAII (Resource Acquisition Is Initialization)?',
    options: [
      {
        key: 'A',
        text: 'A C++ idiom where resources (memory, file handles, mutexes) are tied to object lifetime, acquired in constructors and released automatically in destructors',
        isCorrect: true,
      },
      { key: 'B', text: 'Initializing all variables to zero at program start', isCorrect: false },
      { key: 'C', text: 'An algorithmic complexity standard', isCorrect: false },
      { key: 'D', text: 'A database initialization protocol', isCorrect: false },
    ],
    explanation:
      'RAII binds resource management to stack unwinding, guaranteeing leak-free cleanup even when exceptions are thrown.',
    expectedTimeSeconds: 25,
    tags: ['cpp', 'raii', 'resource-management'],
  },

  // 3. Bitwise Manipulation
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which C expression evaluates to TRUE if and only if positive integer N is a power of 2?',
    options: [
      { key: 'A', text: '(N & (N - 1)) == 0', isCorrect: true },
      { key: 'B', text: '(N | (N - 1)) == 0', isCorrect: false },
      { key: 'C', text: '(N ^ (N - 1)) == 0', isCorrect: false },
      { key: 'D', text: '(N % 2) == 0', isCorrect: false },
    ],
    explanation:
      'A power of 2 has exactly one set bit (e.g. 8 = 1000b). N - 1 has all lower bits set (7 = 0111b). Bitwise AND clears that single bit to 0.',
    expectedTimeSeconds: 20,
    tags: ['bitwise', 'bit-manipulation'],
  },
  {
    topicSlug: 'programming',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'What is the value of the bitwise XOR expression: `12 ^ 10`?',
    numericAnswer: 6,
    numericTolerance: 0,
    explanation:
      '12 in binary is 1100b. 10 in binary is 1010b. 1100b XOR 1010b = 0110b = 6 in decimal.',
    expectedTimeSeconds: 20,
    tags: ['bitwise', 'xor'],
  },
  {
    topicSlug: 'programming',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'What is the result of shifting integer 5 to the left by 3 bits (`5 << 3`)?',
    numericAnswer: 40,
    numericTolerance: 0,
    explanation:
      'Left shifting by k bits multiplies the integer by 2^k: 5 << 3 = 5 * 2^3 = 5 * 8 = 40.',
    expectedTimeSeconds: 15,
    tags: ['bitwise', 'bit-shift'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: "How does Brian Kernighan's algorithm count the number of set bits (1s) in an integer efficiently?",
    options: [
      {
        key: 'A',
        text: 'By executing `N = N & (N - 1)` in a loop, which clears the lowest set bit in each iteration until N becomes 0',
        isCorrect: true,
      },
      { key: 'B', text: 'By dividing by 2 repeatedly', isCorrect: false },
      {
        key: 'C',
        text: 'By converting the number to a string and counting chars',
        isCorrect: false,
      },
      { key: 'D', text: 'By using recursion without base case', isCorrect: false },
    ],
    explanation:
      'Each `N & (N - 1)` clears the least significant set bit, iterating only as many times as there are set bits rather than all 32 or 64 bits.',
    expectedTimeSeconds: 25,
    tags: ['bitwise', 'bit-count'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'How can two integer variables a and b be swapped without using a third temporary variable using bitwise operations?',
    options: [
      { key: 'A', text: 'a = a ^ b; b = a ^ b; a = a ^ b;', isCorrect: true },
      { key: 'B', text: 'a = a & b; b = a & b; a = a & b;', isCorrect: false },
      { key: 'C', text: 'a = a | b; b = a | b; a = a | b;', isCorrect: false },
      { key: 'D', text: 'a = ~b; b = ~a; a = ~b;', isCorrect: false },
    ],
    explanation:
      'Using the properties of XOR (x ^ x = 0 and x ^ 0 = x), the three XOR operations swap a and b without temporary storage or arithmetic overflow risk.',
    expectedTimeSeconds: 20,
    tags: ['bitwise', 'xor-swap'],
  },

  // 4. Parameter Passing & Scope
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In Java and Python, what parameter passing mechanism is actually used for object references passed to functions?',
    options: [
      {
        key: 'A',
        text: 'Pass-by-value of the reference (the reference address is copied by value)',
        isCorrect: true,
      },
      {
        key: 'B',
        text: "Pure pass-by-reference (reassigning the parameter variable inside the function reassigns the caller's variable)",
        isCorrect: false,
      },
      { key: 'C', text: 'Pass-by-name', isCorrect: false },
      { key: 'D', text: 'Pass-by-macro expansion', isCorrect: false },
    ],
    explanation:
      "Java and Python copy the object pointer/reference by value. Reassigning the parameter variable inside the function does not change the caller's variable, but mutating object fields does mutate the underlying object.",
    expectedTimeSeconds: 30,
    tags: ['programming', 'parameter-passing', 'pass-by-value'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What does the `volatile` keyword in C/C++ indicate to the compiler optimizer?',
    options: [
      {
        key: 'A',
        text: 'The variable can be modified unexpectedly by external hardware or concurrent threads, so the compiler must not cache its value in CPU registers or optimize away reads/writes',
        isCorrect: true,
      },
      { key: 'B', text: 'The variable is encrypted in RAM', isCorrect: false },
      {
        key: 'C',
        text: 'The variable is automatically thread-safe without locks',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'The variable is destroyed immediately after initialization',
        isCorrect: false,
      },
    ],
    explanation:
      "`volatile` informs the compiler that the value may change outside the compiler's knowledge (e.g., memory-mapped I/O), forcing memory reads on every access.",
    expectedTimeSeconds: 25,
    tags: ['cpp', 'volatile', 'compiler-optimization'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is Tail Call Optimization (TCO)?',
    options: [
      {
        key: 'A',
        text: 'A compiler optimization where a recursive call that is the very last operation of a function reuses the current stack frame instead of pushing a new frame',
        isCorrect: true,
      },
      { key: 'B', text: 'Deleting unused code at the end of a file', isCorrect: false },
      { key: 'C', text: 'Optimizing tail-end array access', isCorrect: false },
      { key: 'D', text: 'Sorting an array from the end', isCorrect: false },
    ],
    explanation:
      "When the return value of a recursive call is immediately returned without further computation, the compiler can overwrite the caller's stack frame, converting recursion into a loop with O(1) stack space.",
    expectedTimeSeconds: 30,
    tags: ['recursion', 'tail-call-optimization'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What causes a "Stack Overflow" error in programming?',
    options: [
      {
        key: 'A',
        text: 'Excessive or unbounded recursive calls exceeding the allocated maximum call stack memory size',
        isCorrect: true,
      },
      { key: 'B', text: 'Allocating too much memory on the heap using new', isCorrect: false },
      { key: 'C', text: 'A division by zero exception', isCorrect: false },
      { key: 'D', text: 'An out-of-bounds database query', isCorrect: false },
    ],
    explanation:
      'Each function invocation adds a stack frame. Deep or infinite recursion consumes all contiguous stack memory, triggering a stack overflow exception or segfault.',
    expectedTimeSeconds: 15,
    tags: ['programming', 'stack-overflow', 'recursion'],
  },

  // 5. Types & Errors
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the difference between Statically Typed languages (e.g. TypeScript, Go, Java) and Dynamically Typed languages (e.g. JavaScript, Python)?',
    options: [
      {
        key: 'A',
        text: 'Static typing checks and enforces variable types at compile-time; dynamic typing associates types with runtime values and checks types at execution time',
        isCorrect: true,
      },
      { key: 'B', text: 'Dynamically typed languages do not have types at all', isCorrect: false },
      { key: 'C', text: 'Static typing runs only in web browsers', isCorrect: false },
      {
        key: 'D',
        text: 'Dynamic typing produces faster binaries than static typing',
        isCorrect: false,
      },
    ],
    explanation:
      'Static type checking catches type mismatch errors prior to execution during compilation, while dynamically typed languages bind types to runtime values.',
    expectedTimeSeconds: 20,
    tags: ['type-systems'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the `finally` block in a `try-catch-finally` construct?',
    options: [
      {
        key: 'A',
        text: 'To execute cleanup code guaranteed to run regardless of whether an exception was thrown or caught (or even if return is called in try)',
        isCorrect: true,
      },
      { key: 'B', text: 'To catch uncaught errors only', isCorrect: false },
      { key: 'C', text: 'To terminate the program immediately', isCorrect: false },
      { key: 'D', text: 'To restart the function if it failed', isCorrect: false },
    ],
    explanation:
      'The `finally` block always executes when exiting the try/catch construct, guaranteeing release of external resources such as file streams or network handles.',
    expectedTimeSeconds: 20,
    tags: ['error-handling', 'try-catch-finally'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'In JavaScript/TypeScript, what is the difference between `==` and `===` operators?',
    options: [
      {
        key: 'A',
        text: '`==` performs type coercion before comparison; `===` strictly compares both value and type without coercion',
        isCorrect: true,
      },
      { key: 'B', text: '`===` performs type conversion while `==` does not', isCorrect: false },
      { key: 'C', text: '`==` is for numbers only; `===` is for strings only', isCorrect: false },
      { key: 'D', text: '`===` is an assignment operator', isCorrect: false },
    ],
    explanation:
      '`==` converts operands to common types using loose equality rules, while `===` checks strict identity without type conversion.',
    expectedTimeSeconds: 15,
    tags: ['typescript', 'javascript', 'equality'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a "Closure" in functional programming and JavaScript?',
    options: [
      {
        key: 'A',
        text: 'A function bundled together with references to its surrounding lexical environment (variables in outer scope retained even after the outer function returns)',
        isCorrect: true,
      },
      { key: 'B', text: 'A function that closes file streams', isCorrect: false },
      { key: 'C', text: 'The termination statement of a loop', isCorrect: false },
      { key: 'D', text: 'A method with no return statement', isCorrect: false },
    ],
    explanation:
      "A closure gives an inner function access to an outer function's lexical scope variables even after the outer function has finished executing.",
    expectedTimeSeconds: 25,
    tags: ['javascript', 'closures', 'functional-programming'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the purpose of the `const` keyword in modern programming languages?',
    options: [
      {
        key: 'A',
        text: 'To declare an immutable variable binding whose identifier cannot be reassigned after initialization',
        isCorrect: true,
      },
      { key: 'B', text: 'To define a global system constant across all files', isCorrect: false },
      { key: 'C', text: 'To allocate memory in read-only ROM', isCorrect: false },
      { key: 'D', text: 'To make an object deep-frozen recursively', isCorrect: false },
    ],
    explanation:
      '`const` prevents reassignment of the variable binding. (In JS/TS, object properties can still be mutated unless Object.freeze() is used).',
    expectedTimeSeconds: 15,
    tags: ['programming', 'const'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a "Race Condition" in concurrent programming?',
    options: [
      {
        key: 'A',
        text: 'When the outcome of a program depends unpredictably on the relative order or interleaving of execution across multiple concurrent threads accessing shared mutable state without proper synchronization',
        isCorrect: true,
      },
      { key: 'B', text: 'When two algorithms compete to finish first', isCorrect: false },
      { key: 'C', text: 'When a network connection is too slow', isCorrect: false },
      { key: 'D', text: 'When CPU frequency spikes to maximum', isCorrect: false },
    ],
    explanation:
      'A race condition occurs when concurrent threads perform non-atomic read-modify-write operations on shared state, causing unpredictable and erroneous program states.',
    expectedTimeSeconds: 25,
    tags: ['concurrency', 'race-condition'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In C, what is the output of `sizeof(char)` on any standard-compliant architecture?',
    options: [
      { key: 'A', text: '1 (by definition)', isCorrect: true },
      { key: 'B', text: '2', isCorrect: false },
      { key: 'C', text: '4', isCorrect: false },
      { key: 'D', text: 'Depends on 32-bit or 64-bit operating system', isCorrect: false },
    ],
    explanation:
      'The C standard explicitly defines sizeof(char) to be 1 byte by definition. All other sizes are defined in multiples of sizeof(char).',
    expectedTimeSeconds: 15,
    tags: ['c', 'sizeof', 'types'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the `static` keyword when applied to a local variable inside a C/C++ function?',
    options: [
      {
        key: 'A',
        text: 'The variable retains its value across multiple invocations of the function, living for the entire lifetime of the program',
        isCorrect: true,
      },
      { key: 'B', text: 'The variable is destroyed when the function returns', isCorrect: false },
      { key: 'C', text: 'The variable cannot be read by any code', isCorrect: false },
      { key: 'D', text: 'The variable is stored in the CPU instruction cache', isCorrect: false },
    ],
    explanation:
      'Static local variables are allocated in the data segment, initialized once when execution first passes through their declaration, and persist across function calls.',
    expectedTimeSeconds: 20,
    tags: ['c', 'static-variable'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the fundamental difference between an Abstract Syntax Tree (AST) and a parse tree (concrete syntax tree) in compiler design?',
    options: [
      {
        key: 'A',
        text: 'An AST omits superficial syntactic details (like parentheses, semicolons, whitespace) and captures only the essential structural semantic hierarchy of source code',
        isCorrect: true,
      },
      { key: 'B', text: 'An AST is generated before lexical analysis', isCorrect: false },
      { key: 'C', text: 'Parse trees contain only binary expressions', isCorrect: false },
      { key: 'D', text: 'AST is only used in bytecode interpreters', isCorrect: false },
    ],
    explanation:
      'Concrete parse trees represent the complete grammar derivations including punctuation tokens, whereas ASTs abstract away syntax noise to represent semantic constructs directly.',
    expectedTimeSeconds: 30,
    tags: ['compilers', 'ast'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is "Garbage Collection" in runtime environments (such as Node.js V8 or Java JVM)?',
    options: [
      {
        key: 'A',
        text: 'An automatic memory management subsystem that detects and reclaims heap memory occupied by objects that are no longer reachable from root references',
        isCorrect: true,
      },
      { key: 'B', text: 'Deleting temporary cache files on disk', isCorrect: false },
      { key: 'C', text: 'Terminating zombie background processes', isCorrect: false },
      { key: 'D', text: 'Resetting the CPU register file on interrupt', isCorrect: false },
    ],
    explanation:
      'Garbage collectors (e.g. Mark-and-Sweep, Generational GC) trace object reachability from root references and reclaim unreferenced heap allocations automatically.',
    expectedTimeSeconds: 25,
    tags: ['garbage-collection', 'memory-management'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the `volatile` keyword in Java?',
    options: [
      {
        key: 'A',
        text: 'Guarantees that reads and writes to the variable are directly synchronized with main memory (ensuring visibility across threads) and establishes happens-before memory ordering',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Makes compound operations like `i++` atomic without locks',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Prevents the garbage collector from freeing the object',
        isCorrect: false,
      },
      { key: 'D', text: 'Encrypts variable values in memory', isCorrect: false },
    ],
    explanation:
      'In Java, `volatile` ensures memory visibility (no thread-local cache stale reads) and prevents instruction reordering around the variable, though it does not make compound statements (i++) atomic.',
    expectedTimeSeconds: 30,
    tags: ['java', 'volatile', 'concurrency'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a "Deadlock" in concurrent multithreading?',
    options: [
      {
        key: 'A',
        text: 'A state where two or more threads are permanently blocked, each waiting for a lock held by another in a circular dependency chain',
        isCorrect: true,
      },
      { key: 'B', text: 'When a thread terminates due to unhandled exceptions', isCorrect: false },
      { key: 'C', text: 'When CPU utilization hits 100%', isCorrect: false },
      { key: 'D', text: 'When memory is completely full', isCorrect: false },
    ],
    explanation:
      'Deadlock arises when threads acquire locks in conflicting orders (e.g., Thread 1 holds A and wants B; Thread 2 holds B and wants A), creating an unresolvable cycle.',
    expectedTimeSeconds: 20,
    tags: ['concurrency', 'deadlock'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What does the term "Idempotent" mean in software engineering and REST API design?',
    options: [
      {
        key: 'A',
        text: 'An operation that produces the exact same system state regardless of whether it is executed once or multiple times',
        isCorrect: true,
      },
      { key: 'B', text: 'An operation that can only ever be executed once', isCorrect: false },
      { key: 'C', text: 'An operation that requires cryptographic signing', isCorrect: false },
      { key: 'D', text: 'An operation that executes in zero milliseconds', isCorrect: false },
    ],
    explanation:
      'In REST and distributed systems, an operation (e.g. GET, PUT, DELETE) is idempotent if executing it multiple times leaves the system in the identical state as executing it once.',
    expectedTimeSeconds: 20,
    tags: ['system-design', 'idempotency'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of Semantic Versioning (SemVer) format `MAJOR.MINOR.PATCH`?',
    options: [
      {
        key: 'A',
        text: 'MAJOR increments for breaking API changes, MINOR for backwards-compatible new features, and PATCH for backwards-compatible bug fixes',
        isCorrect: true,
      },
      { key: 'B', text: 'MAJOR for year, MINOR for month, PATCH for day', isCorrect: false },
      { key: 'C', text: 'Arbitrary numbers assigned by marketing teams', isCorrect: false },
      { key: 'D', text: 'MAJOR for git commit count, MINOR for branch count', isCorrect: false },
    ],
    explanation:
      'SemVer formalizes dependency compatibility: breaking changes bump MAJOR, non-breaking features bump MINOR, and bugfixes bump PATCH.',
    expectedTimeSeconds: 20,
    tags: ['software-engineering', 'semver'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the difference between a Process and a Thread at the OS level?',
    options: [
      {
        key: 'A',
        text: "A process is an isolated execution environment with its own dedicated virtual address space; threads are lightweight units of execution within a process that share the process's address space and heap",
        isCorrect: true,
      },
      { key: 'B', text: 'Processes run on CPU; threads run on GPU', isCorrect: false },
      {
        key: 'C',
        text: 'Threads have separate memory spaces while processes share memory',
        isCorrect: false,
      },
      { key: 'D', text: 'Processes cannot be scheduled by the OS', isCorrect: false },
    ],
    explanation:
      'Processes provide memory isolation boundaries. Threads provide concurrent execution paths within a shared process memory space.',
    expectedTimeSeconds: 25,
    tags: ['os', 'threads', 'processes'],
  },
  {
    topicSlug: 'programming',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the time complexity of looking up a key in a well-distributed Hash Table on average?',
    options: [
      { key: 'A', text: 'O(1)', isCorrect: true },
      { key: 'B', text: 'O(log N)', isCorrect: false },
      { key: 'C', text: 'O(N)', isCorrect: false },
      { key: 'D', text: 'O(N log N)', isCorrect: false },
    ],
    explanation:
      'With a uniform hash function and low load factor, hash table lookup computes hash and accesses the bucket in O(1) average time.',
    expectedTimeSeconds: 15,
    tags: ['data-structures', 'hash-table', 'complexity'],
  },
];
