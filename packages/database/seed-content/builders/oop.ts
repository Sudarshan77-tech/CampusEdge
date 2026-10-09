import { QuestionSeed } from './quant';

export const oopQuestions: QuestionSeed[] = [
  // 1. Core Pillars of OOP
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which OOP pillar bundles data members and member functions that manipulate that data into a single unit while restricting direct outside access?',
    options: [
      { key: 'A', text: 'Encapsulation', isCorrect: true },
      { key: 'B', text: 'Polymorphism', isCorrect: false },
      { key: 'C', text: 'Inheritance', isCorrect: false },
      { key: 'D', text: 'Dynamic Binding', isCorrect: false },
    ],
    explanation:
      'Encapsulation binds data and code together within classes and hides internal representations using private access specifiers (Information Hiding).',
    expectedTimeSeconds: 15,
    tags: ['oop', 'encapsulation'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the fundamental difference between Compile-time Polymorphism and Run-time Polymorphism?',
    options: [
      {
        key: 'A',
        text: 'Compile-time polymorphism is achieved via method/operator overloading; Run-time polymorphism is achieved via method overriding using virtual functions and dynamic dispatch',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Compile-time uses classes while run-time uses interfaces',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Compile-time is always slower than run-time polymorphism',
        isCorrect: false,
      },
      { key: 'D', text: 'Run-time polymorphism does not require inheritance', isCorrect: false },
    ],
    explanation:
      'Overloading resolves method signatures at compilation (static binding/early binding). Overriding resolves calls at execution time via dynamic dispatch tables (vtable/vptr).',
    expectedTimeSeconds: 25,
    tags: ['oop', 'polymorphism'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In C++ and Java, what is the "Diamond Problem" associated with multiple inheritance?',
    options: [
      {
        key: 'A',
        text: 'An ambiguity arising when a derived class inherits from two parent classes that both inherit from the same grandparent class, causing duplicate grandparent state',
        isCorrect: true,
      },
      { key: 'B', text: 'A deadlock between four threads', isCorrect: false },
      { key: 'C', text: 'A syntax error when implementing multiple interfaces', isCorrect: false },
      { key: 'D', text: 'When a class has four constructors', isCorrect: false },
    ],
    explanation:
      "Class D inheriting from B and C (which both inherit from A) receives duplicate copies of A's fields, creating ambiguity. Resolved in C++ via `virtual inheritance` and in Java by disallowing multiple class inheritance.",
    expectedTimeSeconds: 30,
    tags: ['oop', 'diamond-problem', 'inheritance'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Why should a base class containing virtual functions always declare its Destructor as `virtual` in C++?',
    options: [
      {
        key: 'A',
        text: 'To ensure that deleting a derived object via a base class pointer invokes the derived class destructor first, preventing memory leaks',
        isCorrect: true,
      },
      { key: 'B', text: 'To make derived classes instantiate faster', isCorrect: false },
      { key: 'C', text: 'Because non-virtual destructors cannot be inherited', isCorrect: false },
      { key: 'D', text: 'To force all derived classes to be abstract', isCorrect: false },
    ],
    explanation:
      'If a base destructor is not virtual, calling `delete basePtr` invokes only Base::~Base(), skipping Derived::~Derived() and leaking any resources allocated by Derived.',
    expectedTimeSeconds: 30,
    tags: ['oop', 'destructors', 'virtual-functions'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'How does runtime dynamic dispatch work under the hood in C++?',
    options: [
      {
        key: 'A',
        text: "Each polymorphic class has a Virtual Method Table (vtable) of function pointers; each object instance stores a hidden vptr pointer pointing to its class's vtable",
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'The operating system kernel resolves method names by string comparison',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Methods are recompiled just-in-time on every invocation',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'All virtual functions are converted into if-else statements at runtime',
        isCorrect: false,
      },
    ],
    explanation:
      'The compiler generates a static vtable containing addresses of virtual member functions. Each object carries a vptr initialized at construction pointing to this table.',
    expectedTimeSeconds: 35,
    tags: ['oop', 'vtable', 'vptr'],
  },

  // 2. Abstract Classes vs Interfaces
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is a primary distinction between an Abstract Class and an Interface in classical object-oriented design?',
    options: [
      {
        key: 'A',
        text: 'An abstract class can maintain state (instance fields) and constructors; an interface defines a contract of behavior without instance state',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Abstract classes can be instantiated directly with `new`',
        isCorrect: false,
      },
      { key: 'C', text: 'A class can extend multiple abstract classes in Java', isCorrect: false },
      { key: 'D', text: 'Interfaces cannot have method signatures', isCorrect: false },
    ],
    explanation:
      'Abstract classes provide base implementation and state along an "is-a" taxonomy. Interfaces declare contractual capabilities ("can-do") implementable by disparate classes.',
    expectedTimeSeconds: 25,
    tags: ['oop', 'abstract-class', 'interfaces'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Why is "Composition favored over Inheritance" in modern software architecture?',
    options: [
      {
        key: 'A',
        text: 'Composition promotes loose coupling, avoids rigid class hierarchies, and allows dynamic behavior modification at runtime',
        isCorrect: true,
      },
      { key: 'B', text: 'Inheritance is deprecated in all modern languages', isCorrect: false },
      { key: 'C', text: 'Composition uses less RAM than inheritance', isCorrect: false },
      { key: 'D', text: 'Inheritance does not allow code reuse', isCorrect: false },
    ],
    explanation:
      'Composition ("has-a") decouples components and avoids fragile base class hierarchies, making code easier to test, extend, and refactor than rigid inheritance ("is-a").',
    expectedTimeSeconds: 25,
    tags: ['oop', 'composition-over-inheritance'],
  },

  // 3. SOLID Principles
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What does the Single Responsibility Principle (SRP) state?',
    options: [
      {
        key: 'A',
        text: 'A class should have one, and only one, reason to change',
        isCorrect: true,
      },
      { key: 'B', text: 'A class should contain only one method', isCorrect: false },
      { key: 'C', text: 'Only one developer should work on a file', isCorrect: false },
      { key: 'D', text: 'Every method should return a single variable', isCorrect: false },
    ],
    explanation:
      'SRP states that a software module or class should be responsible to one, and only one, actor or business concern ("one reason to change").',
    expectedTimeSeconds: 20,
    tags: ['solid', 'srp'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What does the Open/Closed Principle (OCP) mandate?',
    options: [
      {
        key: 'A',
        text: 'Software entities should be open for extension, but closed for modification',
        isCorrect: true,
      },
      { key: 'B', text: 'Files must be closed after writing', isCorrect: false },
      {
        key: 'C',
        text: 'Classes should not be accessible outside their package',
        isCorrect: false,
      },
      { key: 'D', text: 'Databases should never accept new schemas', isCorrect: false },
    ],
    explanation:
      "OCP means you can extend a module's behavior (e.g. by adding new subclasses or strategy implementations) without modifying existing tested source code.",
    expectedTimeSeconds: 20,
    tags: ['solid', 'ocp'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which SOLID principle is violated when a `Square` subclass inherits from a `Rectangle` class and overrides `setWidth` to mutate both width and height, breaking client assumptions about rectangles?',
    options: [
      { key: 'A', text: 'Liskov Substitution Principle (LSP)', isCorrect: true },
      { key: 'B', text: 'Single Responsibility Principle (SRP)', isCorrect: false },
      { key: 'C', text: 'Interface Segregation Principle (ISP)', isCorrect: false },
      { key: 'D', text: 'Dependency Inversion Principle (DIP)', isCorrect: false },
    ],
    explanation:
      'LSP requires that objects of a superclass should be replaceable with objects of a subclass without altering the correctness of the program.',
    expectedTimeSeconds: 30,
    tags: ['solid', 'lsp'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What does the Interface Segregation Principle (ISP) advocate?',
    options: [
      {
        key: 'A',
        text: 'Clients should not be forced to depend upon interfaces that they do not use (prefer small, role-specific interfaces over fat monolithic interfaces)',
        isCorrect: true,
      },
      { key: 'B', text: 'All interfaces must be kept in separate directories', isCorrect: false },
      { key: 'C', text: 'Every class must implement at least two interfaces', isCorrect: false },
      { key: 'D', text: 'Never use interfaces in public APIs', isCorrect: false },
    ],
    explanation:
      'ISP prevents "fat" interfaces by breaking large interfaces into smaller, cohesive role interfaces tailored to specific client needs.',
    expectedTimeSeconds: 25,
    tags: ['solid', 'isp'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What does the Dependency Inversion Principle (DIP) state?',
    options: [
      {
        key: 'A',
        text: 'High-level modules should not depend on low-level modules; both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Dependencies must be declared in reverse alphabetical order',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Low-level modules must inject high-level classes directly',
        isCorrect: false,
      },
      { key: 'D', text: 'Inheritance should be avoided completely', isCorrect: false },
    ],
    explanation:
      'DIP decouples high-level policy code from low-level infrastructure (e.g. database, email sender) by programming against abstract interfaces.',
    expectedTimeSeconds: 30,
    tags: ['solid', 'dip'],
  },

  // 4. Design Patterns: Creational
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which design pattern ensures a class has only one instance and provides a global access point to that instance?',
    options: [
      { key: 'A', text: 'Singleton Pattern', isCorrect: true },
      { key: 'B', text: 'Factory Pattern', isCorrect: false },
      { key: 'C', text: 'Adapter Pattern', isCorrect: false },
      { key: 'D', text: 'Observer Pattern', isCorrect: false },
    ],
    explanation:
      'The Singleton pattern enforces a single instance via a private constructor and a static getInstance() method.',
    expectedTimeSeconds: 15,
    tags: ['design-patterns', 'singleton'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Why is the Double-Checked Locking pattern used with a `volatile` variable in thread-safe Singleton implementations?',
    options: [
      {
        key: 'A',
        text: 'To avoid synchronization overhead on subsequent reads after initialization, while `volatile` prevents CPU/compiler instruction reordering from publishing an incompletely constructed instance',
        isCorrect: true,
      },
      { key: 'B', text: 'To allow two instances to be created in parallel', isCorrect: false },
      { key: 'C', text: 'To garbage collect the instance periodically', isCorrect: false },
      { key: 'D', text: 'To serialize the singleton to disk', isCorrect: false },
    ],
    explanation:
      'Without `volatile`, instruction reordering may assign the memory pointer to the instance variable before the constructor finishes, allowing another thread to observe a partially constructed object.',
    expectedTimeSeconds: 35,
    tags: ['design-patterns', 'singleton', 'concurrency'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which design pattern is best suited for constructing complex objects step-by-step with many optional parameters (avoiding telescoping constructors)?',
    options: [
      { key: 'A', text: 'Builder Pattern', isCorrect: true },
      { key: 'B', text: 'Decorator Pattern', isCorrect: false },
      { key: 'C', text: 'Observer Pattern', isCorrect: false },
      { key: 'D', text: 'Flyweight Pattern', isCorrect: false },
    ],
    explanation:
      'The Builder pattern separates object construction from its representation, providing fluent method chaining for optional configurations before invoking .build().',
    expectedTimeSeconds: 20,
    tags: ['design-patterns', 'builder'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the Factory Method design pattern?',
    options: [
      {
        key: 'A',
        text: 'Defining an interface for creating an object, but letting subclasses decide which class to instantiate',
        isCorrect: true,
      },
      { key: 'B', text: 'Creating objects using clone()', isCorrect: false },
      { key: 'C', text: 'A method that destroys obsolete objects', isCorrect: false },
      { key: 'D', text: 'A database query generator', isCorrect: false },
    ],
    explanation:
      'Factory Method delegates object instantiation to derived classes, allowing high-level code to work with common product interfaces.',
    expectedTimeSeconds: 25,
    tags: ['design-patterns', 'factory-method'],
  },

  // 5. Design Patterns: Structural & Behavioral
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which design pattern converts the interface of a class into another interface clients expect, allowing incompatible interfaces to work together?',
    options: [
      { key: 'A', text: 'Adapter Pattern', isCorrect: true },
      { key: 'B', text: 'Facade Pattern', isCorrect: false },
      { key: 'C', text: 'Strategy Pattern', isCorrect: false },
      { key: 'D', text: 'Visitor Pattern', isCorrect: false },
    ],
    explanation:
      'The Adapter pattern wraps an existing class with an incompatible interface to match the target interface expected by the client.',
    expectedTimeSeconds: 20,
    tags: ['design-patterns', 'adapter'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which design pattern attaches additional responsibilities to an object dynamically at runtime without modifying its class or using subclassing?',
    options: [
      { key: 'A', text: 'Decorator Pattern', isCorrect: true },
      { key: 'B', text: 'Proxy Pattern', isCorrect: false },
      { key: 'C', text: 'Singleton Pattern', isCorrect: false },
      { key: 'D', text: 'Template Method Pattern', isCorrect: false },
    ],
    explanation:
      'The Decorator pattern wraps an object with another object implementing the same interface, augmenting behavior dynamically (e.g. Java I/O streams).',
    expectedTimeSeconds: 25,
    tags: ['design-patterns', 'decorator'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which design pattern provides a simplified, unified high-level interface to a complex subsystem of classes?',
    options: [
      { key: 'A', text: 'Facade Pattern', isCorrect: true },
      { key: 'B', text: 'Adapter Pattern', isCorrect: false },
      { key: 'C', text: 'Bridge Pattern', isCorrect: false },
      { key: 'D', text: 'Chain of Responsibility', isCorrect: false },
    ],
    explanation:
      'A Facade provides a clean entry point that hides the detailed interactions of multiple subsystem classes behind a simple API.',
    expectedTimeSeconds: 20,
    tags: ['design-patterns', 'facade'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which behavioral pattern defines a one-to-many dependency where when one subject changes state, all its registered dependents are notified and updated automatically?',
    options: [
      { key: 'A', text: 'Observer Pattern', isCorrect: true },
      { key: 'B', text: 'Strategy Pattern', isCorrect: false },
      { key: 'C', text: 'Command Pattern', isCorrect: false },
      { key: 'D', text: 'State Pattern', isCorrect: false },
    ],
    explanation:
      "The Observer pattern (Pub/Sub) maintains a subscriber list and dispatches update notifications whenever the subject's internal state mutates.",
    expectedTimeSeconds: 20,
    tags: ['design-patterns', 'observer'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which design pattern defines a family of interchangeable algorithms, encapsulates each one, and makes them swappable at runtime inside a context object?',
    options: [
      { key: 'A', text: 'Strategy Pattern', isCorrect: true },
      { key: 'B', text: 'Template Method Pattern', isCorrect: false },
      { key: 'C', text: 'State Pattern', isCorrect: false },
      { key: 'D', text: 'Command Pattern', isCorrect: false },
    ],
    explanation:
      'The Strategy pattern enables selecting algorithms (such as payment processing or sorting strategies) dynamically at runtime via composition.',
    expectedTimeSeconds: 25,
    tags: ['design-patterns', 'strategy'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the Template Method pattern?',
    options: [
      {
        key: 'A',
        text: "Defining the skeleton of an algorithm in a base method, deferring specific steps to subclasses without altering the algorithm's overall structure",
        isCorrect: true,
      },
      { key: 'B', text: 'Using C++ templates for generic programming', isCorrect: false },
      { key: 'C', text: 'A pattern for parsing HTML templates', isCorrect: false },
      { key: 'D', text: 'Writing unit test templates', isCorrect: false },
    ],
    explanation:
      'Template Method sets invariant algorithm steps in a base method and exposes abstract/hook methods for subclasses to customize individual steps.',
    expectedTimeSeconds: 25,
    tags: ['design-patterns', 'template-method'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the Copy Constructor in C++?',
    options: [
      {
        key: 'A',
        text: 'A constructor that initializes a new object using an existing object of the same class (`ClassName(const ClassName& other)`)',
        isCorrect: true,
      },
      { key: 'B', text: 'A constructor that copies memory from disk', isCorrect: false },
      { key: 'C', text: 'A constructor that takes no parameters', isCorrect: false },
      { key: 'D', text: 'A constructor generated by an interface', isCorrect: false },
    ],
    explanation:
      'The copy constructor creates an identical copy of an existing object, ensuring deep copies of heap-allocated pointers when needed.',
    expectedTimeSeconds: 20,
    tags: ['oop', 'constructors', 'cpp'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a Shallow Copy versus a Deep Copy of an object containing pointers/references?',
    options: [
      {
        key: 'A',
        text: 'Shallow copy duplicates pointer addresses (sharing referenced heap memory); Deep copy duplicates both the pointers and the underlying pointed-to memory objects',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Shallow copy copies all memory; Deep copy copies only primitive types',
        isCorrect: false,
      },
      { key: 'C', text: 'Deep copy is only available in Java', isCorrect: false },
      { key: 'D', text: 'They behave identically', isCorrect: false },
    ],
    explanation:
      'Shallow copy copies member values directly, leading to double-free bugs if pointers share memory. Deep copy allocates independent memory for copied pointees.',
    expectedTimeSeconds: 25,
    tags: ['oop', 'memory', 'shallow-vs-deep-copy'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What does the `final` keyword indicate when applied to a class in Java (or `sealed` in C#)?',
    options: [
      {
        key: 'A',
        text: 'The class cannot be subclassed or extended by any other class',
        isCorrect: true,
      },
      { key: 'B', text: 'The class cannot be instantiated', isCorrect: false },
      { key: 'C', text: 'The class will be deleted at end of program', isCorrect: false },
      { key: 'D', text: 'The class contains no private methods', isCorrect: false },
    ],
    explanation:
      'Marking a class as `final` prevents inheritance, ensuring its implementation and invariant contracts cannot be altered by derivation.',
    expectedTimeSeconds: 15,
    tags: ['oop', 'java', 'final-keyword'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the Proxy pattern in structural design?',
    options: [
      {
        key: 'A',
        text: 'To provide a surrogate or placeholder object that controls, caches, or protects access to another underlying object',
        isCorrect: true,
      },
      { key: 'B', text: 'To encrypt database credentials', isCorrect: false },
      { key: 'C', text: 'To merge two database tables', isCorrect: false },
      { key: 'D', text: 'To speed up arithmetic computations', isCorrect: false },
    ],
    explanation:
      "A Proxy matches the subject's interface and acts as an intermediary for lazy initialization (Virtual Proxy), access control (Protection Proxy), or remote communication (Remote Proxy).",
    expectedTimeSeconds: 25,
    tags: ['design-patterns', 'proxy'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In C++, what is a "Pure Virtual Function"?',
    options: [
      {
        key: 'A',
        text: 'A virtual function declared with `= 0` that has no implementation in the base class, making the base class abstract',
        isCorrect: true,
      },
      { key: 'B', text: 'A function that takes no parameters', isCorrect: false },
      { key: 'C', text: 'A static method that cannot access member variables', isCorrect: false },
      { key: 'D', text: 'A destructor with no code block', isCorrect: false },
    ],
    explanation:
      'Syntax `virtual void func() = 0;` defines a pure virtual function, mandating that derived classes implement it before being instantiated.',
    expectedTimeSeconds: 20,
    tags: ['oop', 'pure-virtual', 'cpp'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the "Command Pattern" in behavioral design patterns?',
    options: [
      {
        key: 'A',
        text: 'Encapsulating a request as an object, thereby letting you parameterize clients with different requests, queue requests, and support undo/redo operations',
        isCorrect: true,
      },
      { key: 'B', text: 'A pattern that runs shell scripts in terminal', isCorrect: false },
      { key: 'C', text: 'A pattern for parsing CLI command flags', isCorrect: false },
      { key: 'D', text: 'A pattern that executes SQL commands', isCorrect: false },
    ],
    explanation:
      'The Command pattern decouples the invoker from the receiver by wrapping an action and its parameters into a command object with an `execute()` and `undo()` method.',
    expectedTimeSeconds: 25,
    tags: ['design-patterns', 'command-pattern'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is Dependency Injection (DI)?',
    options: [
      {
        key: 'A',
        text: 'A design pattern where an object receives its dependencies from external code (via constructor, setter, or framework) rather than creating them internally',
        isCorrect: true,
      },
      { key: 'B', text: 'Injecting malicious SQL into a form field', isCorrect: false },
      { key: 'C', text: 'Downloading npm packages dynamically at runtime', isCorrect: false },
      { key: 'D', text: 'Importing headers using preprocessor macros', isCorrect: false },
    ],
    explanation:
      'Dependency Injection is a realization of Inversion of Control (IoC), passing dependencies into components to facilitate loose coupling and easy unit testing with mocks.',
    expectedTimeSeconds: 25,
    tags: ['oop', 'dependency-injection', 'ioc'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which design pattern is best suited for traversing a collection of elements aggregate without exposing its underlying internal representation (e.g. list, tree, hash)?',
    options: [
      { key: 'A', text: 'Iterator Pattern', isCorrect: true },
      { key: 'B', text: 'Visitor Pattern', isCorrect: false },
      { key: 'C', text: 'Mediator Pattern', isCorrect: false },
      { key: 'D', text: 'Memento Pattern', isCorrect: false },
    ],
    explanation:
      'The Iterator pattern provides standard access methods (hasNext(), next()) to traverse elements of an aggregate collection sequentially without leaking internal data structures.',
    expectedTimeSeconds: 20,
    tags: ['design-patterns', 'iterator'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the Memento pattern?',
    options: [
      {
        key: 'A',
        text: "To capture and externalize an object's internal state without violating encapsulation, so the object can be restored to this state later (undo)",
        isCorrect: true,
      },
      { key: 'B', text: 'To cache API responses in Redis', isCorrect: false },
      { key: 'C', text: 'To log error messages to disk', isCorrect: false },
      { key: 'D', text: 'To serialize objects to JSON', isCorrect: false },
    ],
    explanation:
      "The Memento pattern stores a snapshot of an originator object's state in a memento object without exposing private fields, enabling rollback/undo mechanisms.",
    expectedTimeSeconds: 25,
    tags: ['design-patterns', 'memento'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the State design pattern?',
    options: [
      {
        key: 'A',
        text: 'Allowing an object to alter its behavior when its internal state changes, appearing as if the object changed its class',
        isCorrect: true,
      },
      { key: 'B', text: 'Managing global variables in React', isCorrect: false },
      { key: 'C', text: 'Storing session cookies on the server', isCorrect: false },
      { key: 'D', text: 'A pattern that tracks database migrations', isCorrect: false },
    ],
    explanation:
      'The State pattern encapsulates state-specific behaviors into separate state classes, avoiding huge conditional switch statements.',
    expectedTimeSeconds: 25,
    tags: ['design-patterns', 'state-pattern'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What does the `super` (or `base` in C#) keyword do inside a subclass constructor or method?',
    options: [
      {
        key: 'A',
        text: 'References or calls the immediate parent class constructor or method',
        isCorrect: true,
      },
      { key: 'B', text: 'Calls the grandparent class constructor', isCorrect: false },
      { key: 'C', text: 'Grants root administrative permissions', isCorrect: false },
      { key: 'D', text: 'Forces memory allocation in high-speed cache', isCorrect: false },
    ],
    explanation:
      'The `super` keyword refers to the direct superclass, allowing derived classes to invoke overridden methods or chain constructor initialization.',
    expectedTimeSeconds: 15,
    tags: ['oop', 'inheritance', 'super'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is Method Overloading?',
    options: [
      {
        key: 'A',
        text: 'Defining multiple methods in the same class with the same name but different parameter types or parameter counts',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Redefining a parent class method in a child class with the exact same signature',
        isCorrect: false,
      },
      { key: 'C', text: 'Running a method until the stack overflows', isCorrect: false },
      { key: 'D', text: 'Passing too many arguments to a variadic function', isCorrect: false },
    ],
    explanation:
      'Method overloading allows multiple methods to share the same name within a scope, distinguished by differing parameter lists (resolved at compile time).',
    expectedTimeSeconds: 20,
    tags: ['oop', 'method-overloading'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Can method overloading in Java or C++ be achieved by ONLY changing the return type of the method?',
    options: [
      {
        key: 'A',
        text: 'No, methods cannot be overloaded based solely on differing return types because the compiler cannot unambiguously resolve which method to call without context',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Yes, the compiler infers the return type from the left-hand variable assignment',
        isCorrect: false,
      },
      { key: 'C', text: 'Yes, but only in static methods', isCorrect: false },
      { key: 'D', text: 'Yes, if declared final', isCorrect: false },
    ],
    explanation:
      'If a method call does not assign its return value (e.g. `calculate();`), the compiler cannot determine which version to invoke. Overloading requires differences in the parameter list.',
    expectedTimeSeconds: 25,
    tags: ['oop', 'method-overloading'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the Flyweight design pattern?',
    options: [
      {
        key: 'A',
        text: 'To minimize memory consumption by sharing as much common state (intrinsic state) as possible among large numbers of similar fine-grained objects',
        isCorrect: true,
      },
      { key: 'B', text: 'To compress network packets', isCorrect: false },
      { key: 'C', text: 'To run background threads with low CPU priority', isCorrect: false },
      { key: 'D', text: 'To make classes lightweight by removing all methods', isCorrect: false },
    ],
    explanation:
      'The Flyweight pattern separates immutable intrinsic state (shared) from mutable extrinsic state (passed from context), drastically lowering memory footprint.',
    expectedTimeSeconds: 25,
    tags: ['design-patterns', 'flyweight'],
  },
  {
    topicSlug: 'oop',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is a "Static Member Variable" in a class?',
    options: [
      {
        key: 'A',
        text: 'A class-level variable shared by all instances of the class rather than belonging to individual object instances',
        isCorrect: true,
      },
      { key: 'B', text: 'A variable that cannot be changed once initialized', isCorrect: false },
      { key: 'C', text: 'A variable stored on the call stack', isCorrect: false },
      {
        key: 'D',
        text: 'A variable that disappears when an object is destroyed',
        isCorrect: false,
      },
    ],
    explanation:
      'Static variables belong to the class itself and exist once in static memory, shared across all instantiated objects.',
    expectedTimeSeconds: 15,
    tags: ['oop', 'static-members'],
  },
];
