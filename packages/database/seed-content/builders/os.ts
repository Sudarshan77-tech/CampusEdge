import { QuestionSeed } from './quant';

export const osQuestions: QuestionSeed[] = [
  // 1. Processes, Threads & CPU Scheduling
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What resource is shared among threads belonging to the same process?',
    options: [
      { key: 'A', text: 'Heap memory and global variables', isCorrect: true },
      { key: 'B', text: 'Call stack', isCorrect: false },
      { key: 'C', text: 'CPU register set', isCorrect: false },
      { key: 'D', text: 'Program Counter (PC)', isCorrect: false },
    ],
    explanation:
      'Threads within the same process share code, data (global variables), and heap memory, but each thread maintains its own program counter, stack, and register state.',
    expectedTimeSeconds: 20,
    tags: ['os', 'threads', 'process'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which CPU scheduling algorithm can suffer from the "Convoy Effect"?',
    options: [
      { key: 'A', text: 'First-Come, First-Served (FCFS)', isCorrect: true },
      { key: 'B', text: 'Round Robin (RR) with small quantum', isCorrect: false },
      { key: 'C', text: 'Shortest Job First (Preemptive)', isCorrect: false },
      { key: 'D', text: 'Multilevel Feedback Queue', isCorrect: false },
    ],
    explanation:
      'In FCFS, if a long CPU-bound process runs first, multiple short I/O-bound processes queue up waiting for CPU, leading to the convoy effect and poor device utilization.',
    expectedTimeSeconds: 25,
    tags: ['os', 'cpu-scheduling', 'fcfs'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What happens in Round Robin CPU scheduling if the time quantum Q is chosen to be extremely large (larger than the longest CPU burst)?',
    options: [
      {
        key: 'A',
        text: 'It behaves identically to First-Come, First-Served (FCFS)',
        isCorrect: true,
      },
      { key: 'B', text: 'It behaves like Shortest Job First', isCorrect: false },
      { key: 'C', text: 'Context switching overhead reaches maximum', isCorrect: false },
      { key: 'D', text: 'Starvation occurs for short jobs', isCorrect: false },
    ],
    explanation:
      'When the time quantum is larger than any process burst time, no process is ever preempted by time slice expiration, degenerating RR into standard FCFS.',
    expectedTimeSeconds: 25,
    tags: ['os', 'cpu-scheduling', 'round-robin'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which CPU scheduling algorithm is mathematically proven to give the minimum average waiting time for a given set of processes with known burst times?',
    options: [
      { key: 'A', text: 'Shortest Job First (SJF)', isCorrect: true },
      { key: 'B', text: 'First-Come, First-Served (FCFS)', isCorrect: false },
      { key: 'C', text: 'Priority Scheduling', isCorrect: false },
      { key: 'D', text: 'Round Robin', isCorrect: false },
    ],
    explanation:
      'SJF is optimal because scheduling shorter jobs ahead of longer jobs reduces waiting times across subsequent processes, minimizing average waiting time.',
    expectedTimeSeconds: 20,
    tags: ['os', 'cpu-scheduling', 'sjf'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'In a Unix system, how many total processes (parent + children) exist after executing `fork(); fork(); fork();` sequentially?',
    numericAnswer: 8,
    numericTolerance: 0,
    explanation:
      'Each fork() doubles the number of executing processes. After 3 forks, 2^3 = 8 processes exist in total.',
    expectedTimeSeconds: 20,
    tags: ['os', 'fork', 'system-calls'],
  },

  // 2. Process Synchronization & Concurrency
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What are the three mandatory requirements for any valid solution to the Critical Section problem?',
    options: [
      { key: 'A', text: 'Mutual Exclusion, Progress, and Bounded Waiting', isCorrect: true },
      { key: 'B', text: 'Atomicity, Consistency, and Durability', isCorrect: false },
      { key: 'C', text: 'Fairness, Throughput, and Turnaround', isCorrect: false },
      {
        key: 'D',
        text: 'Deadlock avoidance, Starvation prevention, and Liveness',
        isCorrect: false,
      },
    ],
    explanation:
      'The classic critical section problem mandates: 1. Mutual Exclusion (only one process inside at a time), 2. Progress (decisions on entry made only by competing processes), 3. Bounded Waiting (limit on times others can enter before a waiting process enters).',
    expectedTimeSeconds: 30,
    tags: ['os', 'concurrency', 'critical-section'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the operation of a counting semaphore `P()` (also called `wait()`) on integer semaphore variable S?',
    options: [
      {
        key: 'A',
        text: 'Decrements S; if S < 0, the calling process blocks and waits on the queue',
        isCorrect: true,
      },
      { key: 'B', text: 'Increments S and wakes up a waiting process', isCorrect: false },
      { key: 'C', text: 'Resets S to 0', isCorrect: false },
      { key: 'D', text: 'Reads S without modification', isCorrect: false },
    ],
    explanation:
      'wait(S) decrements S. If S becomes negative (or was 0 depending on convention), the calling process must wait until a signal() increments S.',
    expectedTimeSeconds: 25,
    tags: ['os', 'semaphores'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a "Spinlock" and when is it preferred over a sleep-based mutex?',
    options: [
      {
        key: 'A',
        text: 'A lock where a waiting thread repeatedly loops (busy-waits); preferred in multi-processor systems when expected lock hold time is shorter than a context switch',
        isCorrect: true,
      },
      { key: 'B', text: 'A lock that yields CPU immediately', isCorrect: false },
      { key: 'C', text: 'A lock that causes deadlocks intentionally', isCorrect: false },
      { key: 'D', text: 'A lock implemented only in Python', isCorrect: false },
    ],
    explanation:
      'Spinlocks busy-wait on multi-core systems, avoiding the heavy latency of two context switches (sleeping and waking up) when critical sections are very short.',
    expectedTimeSeconds: 30,
    tags: ['os', 'spinlocks', 'concurrency'],
  },

  // 3. Deadlocks
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which of the following is NOT one of the four necessary Coffman conditions for a deadlock to occur?',
    options: [
      { key: 'A', text: 'Mutual Exclusion', isCorrect: false },
      { key: 'B', text: 'Hold and Wait', isCorrect: false },
      { key: 'C', text: 'Preemption of resources by the scheduler', isCorrect: true },
      { key: 'D', text: 'Circular Wait', isCorrect: false },
    ],
    explanation:
      'The Coffman condition is "No Preemption" (resources cannot be forcibly taken away). Preemption prevents deadlocks.',
    expectedTimeSeconds: 25,
    tags: ['os', 'deadlocks', 'coffman-conditions'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In a Resource Allocation Graph (RAG) where each resource type has ONLY A SINGLE INSTANCE, what does the presence of a cycle signify?',
    options: [
      { key: 'A', text: 'A deadlock definitively exists', isCorrect: true },
      { key: 'B', text: 'A deadlock might exist depending on timing', isCorrect: false },
      { key: 'C', text: 'No deadlock can exist', isCorrect: false },
      { key: 'D', text: 'The system is in a safe state', isCorrect: false },
    ],
    explanation:
      'If every resource type has exactly one instance, a cycle in the resource allocation graph is both a necessary AND sufficient condition for deadlock.',
    expectedTimeSeconds: 25,
    tags: ['os', 'deadlocks', 'rag'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: "What does Dijkstra's Banker's Algorithm determine before granting a resource request to a process?",
    options: [
      {
        key: 'A',
        text: 'Whether granting the request leaves the system in a Safe State where all processes can eventually complete',
        isCorrect: true,
      },
      { key: 'B', text: 'Whether the requesting process has highest priority', isCorrect: false },
      { key: 'C', text: 'Whether the resource is currently locked by a mutex', isCorrect: false },
      { key: 'D', text: 'Whether disk I/O queue is full', isCorrect: false },
    ],
    explanation:
      "The Banker's algorithm tests for safety by simulating the allocation of predetermined maximum possible resources and ensuring a safe execution sequence exists.",
    expectedTimeSeconds: 30,
    tags: ['os', 'deadlock-avoidance', 'bankers-algorithm'],
  },

  // 4. Memory Management & Virtual Memory
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What hardware component translates virtual (logical) memory addresses generated by the CPU into physical RAM addresses?',
    options: [
      { key: 'A', text: 'Memory Management Unit (MMU)', isCorrect: true },
      { key: 'B', text: 'Arithmetic Logic Unit (ALU)', isCorrect: false },
      { key: 'C', text: 'Direct Memory Access Controller (DMA)', isCorrect: false },
      { key: 'D', text: 'Instruction Register (IR)', isCorrect: false },
    ],
    explanation:
      'The MMU is the hardware module that maps virtual addresses to physical addresses using page tables and the Translation Lookaside Buffer (TLB).',
    expectedTimeSeconds: 20,
    tags: ['os', 'mmu', 'virtual-memory'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the Translation Lookaside Buffer (TLB)?',
    options: [
      {
        key: 'A',
        text: 'A high-speed hardware associative cache that stores recent virtual-to-physical page table mappings',
        isCorrect: true,
      },
      { key: 'B', text: 'A swap partition on the hard drive', isCorrect: false },
      { key: 'C', text: 'A buffer for disk write requests', isCorrect: false },
      { key: 'D', text: 'A kernel queue for process scheduling', isCorrect: false },
    ],
    explanation:
      'The TLB is a fast hardware associative cache inside the CPU that avoids memory lookups to the page table when address translations hit.',
    expectedTimeSeconds: 25,
    tags: ['os', 'tlb', 'virtual-memory'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is "Belady\'s Anomaly" in page replacement algorithms?',
    options: [
      {
        key: 'A',
        text: 'The phenomenon where allocating MORE page frames to a process results in MORE page faults under FIFO page replacement',
        isCorrect: true,
      },
      { key: 'B', text: 'When LRU runs slower than FIFO', isCorrect: false },
      { key: 'C', text: 'When a process allocates all available RAM', isCorrect: false },
      { key: 'D', text: 'When stack memory collides with heap memory', isCorrect: false },
    ],
    explanation:
      "Belady's anomaly demonstrates that under FIFO page replacement, increasing the number of page frames can counter-intuitively increase page faults.",
    expectedTimeSeconds: 30,
    tags: ['os', 'page-replacement', 'beladys-anomaly'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which page replacement algorithm is mathematically optimal (yielding minimum possible page faults), though impossible to implement in practice for general workloads?',
    options: [
      { key: 'A', text: "OPT (Belady's Optimal Page Replacement)", isCorrect: true },
      { key: 'B', text: 'Least Recently Used (LRU)', isCorrect: false },
      { key: 'C', text: 'First-In First-Out (FIFO)', isCorrect: false },
      { key: 'D', text: 'Least Frequently Used (LFU)', isCorrect: false },
    ],
    explanation:
      'Optimal page replacement replaces the page that will not be used for the longest period of time in the future, requiring unrealizable future knowledge.',
    expectedTimeSeconds: 25,
    tags: ['os', 'page-replacement', 'optimal'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is "Thrashing" in an operating system?',
    options: [
      {
        key: 'A',
        text: 'A condition where the CPU spends more time swapping pages in and out of secondary storage than executing user processes',
        isCorrect: true,
      },
      { key: 'B', text: 'When disk heads collide with platters', isCorrect: false },
      { key: 'C', text: 'When a thread terminates abnormally', isCorrect: false },
      { key: 'D', text: 'When memory is cleared on shutdown', isCorrect: false },
    ],
    explanation:
      'Thrashing occurs when the sum of working set sizes across active processes exceeds available physical RAM, causing constant page faults and near-zero CPU throughput.',
    expectedTimeSeconds: 25,
    tags: ['os', 'thrashing', 'virtual-memory'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'In a 32-bit virtual memory system with a page size of 4 KB (2^12 bytes), how many bits are used for the page offset (displacement)?',
    numericAnswer: 12,
    numericTolerance: 0,
    explanation:
      'Page offset size = log2(page size in bytes) = log2(4096) = 12 bits. The remaining 20 bits represent the virtual page number.',
    expectedTimeSeconds: 20,
    tags: ['os', 'paging', 'virtual-memory'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is Internal Fragmentation in memory allocation?',
    options: [
      {
        key: 'A',
        text: 'Wasted unused memory space located inside an allocated block or page frame',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Unused memory between allocated blocks in physical memory',
        isCorrect: false,
      },
      { key: 'C', text: 'Disk fragmentation on mechanical drives', isCorrect: false },
      { key: 'D', text: 'Fragmentation inside cache lines', isCorrect: false },
    ],
    explanation:
      'Internal fragmentation occurs when allocated fixed-size chunks (e.g. 4KB page) exceed the actual size requested by a process (e.g. 100 bytes), wasting the remainder within the frame.',
    expectedTimeSeconds: 25,
    tags: ['os', 'memory-management', 'fragmentation'],
  },

  // 5. File Systems & I/O
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In a Unix file system, what metadata is stored in an Inode?',
    options: [
      {
        key: 'A',
        text: 'File permissions, owner UID, file size, timestamps, and pointers to disk data blocks (excluding the filename)',
        isCorrect: true,
      },
      { key: 'B', text: 'Filename and file content only', isCorrect: false },
      { key: 'C', text: 'Process credentials only', isCorrect: false },
      { key: 'D', text: 'Network routing tables', isCorrect: false },
    ],
    explanation:
      'An inode stores all file metadata and data block pointers. Filenames are maintained in directory entries that map names to inode numbers.',
    expectedTimeSeconds: 30,
    tags: ['os', 'file-systems', 'inode'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What happens to the target file data if the original file is deleted when a Hard Link exists?',
    options: [
      {
        key: 'A',
        text: 'The data remains accessible through the hard link until its inode link count decrements to 0',
        isCorrect: true,
      },
      { key: 'B', text: 'The hard link breaks immediately', isCorrect: false },
      { key: 'C', text: 'The file system becomes corrupted', isCorrect: false },
      { key: 'D', text: 'Both files are deleted simultaneously', isCorrect: false },
    ],
    explanation:
      "A hard link is a directory entry referencing the same inode. The inode's link count decrements; data blocks are only freed when the link count reaches 0.",
    expectedTimeSeconds: 25,
    tags: ['os', 'file-systems', 'hard-links'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which disk scheduling algorithm moves the disk arm in one direction serving requests until it reaches the end of the disk, then reverses direction (Elevator algorithm)?',
    options: [
      { key: 'A', text: 'SCAN', isCorrect: true },
      { key: 'B', text: 'C-SCAN', isCorrect: false },
      { key: 'C', text: 'SSTF', isCorrect: false },
      { key: 'D', text: 'FCFS', isCorrect: false },
    ],
    explanation:
      'The SCAN algorithm services requests while sweeping across tracks in one direction, then reverses direction at the boundary like an elevator.',
    expectedTimeSeconds: 20,
    tags: ['os', 'disk-scheduling', 'scan'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which RAID configuration stripes data across disks and provides fault tolerance via distributed parity blocks?',
    options: [
      { key: 'A', text: 'RAID 5', isCorrect: true },
      { key: 'B', text: 'RAID 0', isCorrect: false },
      { key: 'C', text: 'RAID 1', isCorrect: false },
      { key: 'D', text: 'RAID 10', isCorrect: false },
    ],
    explanation:
      'RAID 5 provides block-level striping with distributed parity across all member disks, surviving the failure of any single drive.',
    expectedTimeSeconds: 25,
    tags: ['os', 'raid', 'storage'],
  },

  // 6. OS Concepts & Concurrency Primitives
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is a "Zombie Process" in Unix/Linux?',
    options: [
      {
        key: 'A',
        text: 'A process that has completed execution, but its exit status has not yet been read by its parent via wait()',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'A process whose parent terminated while it continues running',
        isCorrect: false,
      },
      { key: 'C', text: 'A process consuming 100% CPU in an infinite loop', isCorrect: false },
      { key: 'D', text: 'A kernel daemon process', isCorrect: false },
    ],
    explanation:
      'A zombie process has exited, but remains in the process table holding its PID and exit status until the parent calls wait() or waitpid().',
    expectedTimeSeconds: 25,
    tags: ['os', 'process-lifecycle', 'zombie'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is an "Orphan Process" in Unix and which process adopts it?',
    options: [
      {
        key: 'A',
        text: 'A running process whose parent has terminated; adopted by init (PID 1) or systemd',
        isCorrect: true,
      },
      { key: 'B', text: 'A process waiting on disk I/O', isCorrect: false },
      { key: 'C', text: 'A terminated process waiting in memory', isCorrect: false },
      { key: 'D', text: 'A thread detached from a process pool', isCorrect: false },
    ],
    explanation:
      'An orphan process continues executing after its creator parent terminates. It is adopted by init (PID 1) which reaps it upon completion.',
    expectedTimeSeconds: 20,
    tags: ['os', 'orphan-process'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the Translation Lookaside Buffer (TLB) shootdown in multi-core operating systems?',
    options: [
      {
        key: 'A',
        text: "Flushing stale page table mappings cached in other CPU cores' TLBs when a virtual memory mapping is modified or unmapped",
        isCorrect: true,
      },
      { key: 'B', text: 'Shutting down inactive CPU cores to save energy', isCorrect: false },
      { key: 'C', text: 'Killing rogue processes consuming excessive RAM', isCorrect: false },
      { key: 'D', text: 'Clearing L1 instruction cache', isCorrect: false },
    ],
    explanation:
      'A TLB shootdown uses inter-processor interrupts (IPI) to force other CPU cores to invalidate cached entries for modified virtual addresses.',
    expectedTimeSeconds: 35,
    tags: ['os', 'tlb-shootdown', 'multicore'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the primary difference between a Monolithic Kernel and a Microkernel?',
    options: [
      {
        key: 'A',
        text: 'Monolithic kernels run all OS services (file system, drivers, IPC, memory management) in kernel space; microkernels keep only minimal mechanisms (IPC, low-level scheduling) in kernel space, running drivers and servers in user space',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Monolithic kernels are slower than microkernels in all situations',
        isCorrect: false,
      },
      { key: 'C', text: 'Microkernels do not support multi-threading', isCorrect: false },
      { key: 'D', text: 'Microkernels are strictly single-core', isCorrect: false },
    ],
    explanation:
      'Monolithic kernels offer high performance by executing drivers and subsystems in privileged supervisor mode. Microkernels isolate services in user space for modularity and fault tolerance.',
    expectedTimeSeconds: 35,
    tags: ['os', 'kernel-architecture'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which system call in Linux creates an anonymous unidirectional data channel for Inter-Process Communication (IPC)?',
    options: [
      { key: 'A', text: 'pipe()', isCorrect: true },
      { key: 'B', text: 'socket()', isCorrect: false },
      { key: 'C', text: 'mmap()', isCorrect: false },
      { key: 'D', text: 'shmget()', isCorrect: false },
    ],
    explanation:
      'pipe() allocates a pair of file descriptors pointing to a kernel buffer for unidirectional byte-stream IPC between related processes.',
    expectedTimeSeconds: 20,
    tags: ['os', 'ipc', 'pipes'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In modern operating systems, what is Copy-On-Write (COW)?',
    options: [
      {
        key: 'A',
        text: 'An optimization where child processes share identical physical pages with parent processes read-only until one modifies a page, triggering a private page duplicate copy',
        isCorrect: true,
      },
      { key: 'B', text: 'Writing all files to backup disks automatically', isCorrect: false },
      { key: 'C', text: 'A disk scheduling algorithm', isCorrect: false },
      { key: 'D', text: 'Duplicating instructions in CPU pipelines', isCorrect: false },
    ],
    explanation:
      'COW delays page copying on fork() until either process writes to a page, dramatically speeding up process creation and saving physical memory.',
    expectedTimeSeconds: 30,
    tags: ['os', 'copy-on-write', 'virtual-memory'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a Context Switch in operating systems?',
    options: [
      {
        key: 'A',
        text: "The mechanism of saving the CPU execution state (registers, PC, stack pointer) of the current running process and restoring another process's state to resume execution",
        isCorrect: true,
      },
      { key: 'B', text: 'Switching display output from terminal to window', isCorrect: false },
      { key: 'C', text: 'Swapping entire memory onto SSD', isCorrect: false },
      { key: 'D', text: 'Switching between Wi-Fi and Ethernet', isCorrect: false },
    ],
    explanation:
      'A context switch saves the CPU context of a process in its PCB and loads the context of the next scheduled process.',
    expectedTimeSeconds: 25,
    tags: ['os', 'context-switch'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which process state transition is caused by an I/O completion or event signal?',
    options: [
      { key: 'A', text: 'Waiting (Blocked) -> Ready', isCorrect: true },
      { key: 'B', text: 'Running -> Waiting', isCorrect: false },
      { key: 'C', text: 'Ready -> Running', isCorrect: false },
      { key: 'D', text: 'Running -> Terminated', isCorrect: false },
    ],
    explanation:
      'When an I/O operation finishes, the device controller raises an interrupt and the OS transitions the process from Waiting/Blocked back to the Ready queue.',
    expectedTimeSeconds: 20,
    tags: ['os', 'process-states'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the Readers-Writers problem in concurrency?',
    options: [
      {
        key: 'A',
        text: 'Allowing multiple readers to read shared data simultaneously while ensuring writers obtain exclusive access without causing reader or writer starvation',
        isCorrect: true,
      },
      { key: 'B', text: 'A disk format problem on SSDs', isCorrect: false },
      { key: 'C', text: 'A keyboard buffer overrun issue', isCorrect: false },
      { key: 'D', text: 'A syntax error in database transactions', isCorrect: false },
    ],
    explanation:
      'The classic Readers-Writers problem coordinates concurrent readers and exclusive writers using mutexes/semaphores to avoid inconsistent reads and starvation.',
    expectedTimeSeconds: 25,
    tags: ['os', 'concurrency', 'readers-writers'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the role of the Inverted Page Table?',
    options: [
      {
        key: 'A',
        text: 'Having exactly one page table entry per physical memory frame instead of per virtual page, indexed by frame number to save space',
        isCorrect: true,
      },
      { key: 'B', text: 'Inverting bits in memory for encryption', isCorrect: false },
      { key: 'C', text: 'Sorting page tables in reverse order', isCorrect: false },
      { key: 'D', text: 'Managing swap files in reverse order', isCorrect: false },
    ],
    explanation:
      'An inverted page table has one entry for each physical frame in RAM, mapping physical frames back to virtual pages and PIDs, significantly reducing table memory overhead.',
    expectedTimeSeconds: 30,
    tags: ['os', 'paging', 'inverted-page-table'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which system call replaces the current process memory image, code, and data with a new executable binary?',
    options: [
      { key: 'A', text: 'exec() (or execve())', isCorrect: true },
      { key: 'B', text: 'fork()', isCorrect: false },
      { key: 'C', text: 'clone()', isCorrect: false },
      { key: 'D', text: 'exit()', isCorrect: false },
    ],
    explanation:
      'exec() loads and runs an executable program within the existing process, overwriting its current text, data, and stack segments while keeping the same PID.',
    expectedTimeSeconds: 20,
    tags: ['os', 'exec', 'system-calls'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is Priority Inversion and how is it resolved in real-time operating systems?',
    options: [
      {
        key: 'A',
        text: 'When a low-priority thread holds a lock needed by a high-priority thread and a medium-priority thread preempts the low-priority thread; resolved by Priority Inheritance',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'When all threads have equal priority; resolved by random scheduling',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'When high priority processes starve low priority processes',
        isCorrect: false,
      },
      { key: 'D', text: 'When thread priorities are randomized', isCorrect: false },
    ],
    explanation:
      'Priority inversion is fixed via Priority Inheritance, where the low-priority thread temporarily inherits the highest priority of any thread waiting on its lock until it releases it.',
    expectedTimeSeconds: 35,
    tags: ['os', 'priority-inversion', 'real-time'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What does the POSIX function `pthread_mutex_lock()` do when the mutex is already locked by another thread?',
    options: [
      {
        key: 'A',
        text: "It suspends the calling thread and places it on the mutex's wait queue until the mutex is unlocked",
        isCorrect: true,
      },
      { key: 'B', text: 'It returns immediately with an error code', isCorrect: false },
      { key: 'C', text: 'It terminates the thread', isCorrect: false },
      { key: 'D', text: 'It forcibly unlocks the mutex', isCorrect: false },
    ],
    explanation:
      'pthread_mutex_lock() blocks the caller until the lock becomes available. Non-blocking checks are done via pthread_mutex_trylock().',
    expectedTimeSeconds: 25,
    tags: ['os', 'pthreads', 'mutex'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which memory allocation fit strategy allocates the smallest free block that is large enough to satisfy the request?',
    options: [
      { key: 'A', text: 'Best-Fit', isCorrect: true },
      { key: 'B', text: 'First-Fit', isCorrect: false },
      { key: 'C', text: 'Worst-Fit', isCorrect: false },
      { key: 'D', text: 'Next-Fit', isCorrect: false },
    ],
    explanation:
      'Best-Fit searches the entire free list to find the block whose size is closest to the requested size, leaving behind the smallest leftover fragments.',
    expectedTimeSeconds: 20,
    tags: ['os', 'memory-allocation', 'best-fit'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is a "System Call"?',
    options: [
      {
        key: 'A',
        text: 'A programmatic interface allowing a user-space process to request privileged services from the operating system kernel',
        isCorrect: true,
      },
      { key: 'B', text: 'A call between two user applications over a network', isCorrect: false },
      {
        key: 'C',
        text: 'A function call within a standard C library without kernel involvement',
        isCorrect: false,
      },
      { key: 'D', text: 'A telephone notification sent by server monitors', isCorrect: false },
    ],
    explanation:
      'System calls trigger software interrupts (traps) switching CPU mode from user mode (Ring 3) to kernel mode (Ring 0) to execute privileged operations.',
    expectedTimeSeconds: 20,
    tags: ['os', 'system-calls'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the Dirty Bit (Modified Bit) in a page table entry?',
    options: [
      {
        key: 'A',
        text: 'To indicate whether the page has been written to since being loaded into RAM, determining if it must be written back to disk on eviction',
        isCorrect: true,
      },
      { key: 'B', text: 'To identify memory corrupted by malware', isCorrect: false },
      { key: 'C', text: 'To mark whether the page contains executable code', isCorrect: false },
      { key: 'D', text: 'To lock the page permanently in RAM', isCorrect: false },
    ],
    explanation:
      'If the dirty bit is 0, the page on disk is identical to RAM and can be discarded without disk write on eviction. If 1, it must be flushed to disk.',
    expectedTimeSeconds: 25,
    tags: ['os', 'paging', 'dirty-bit'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which mechanism prevents CPU starvation in Multilevel Feedback Queue (MLFQ) scheduling?',
    options: [
      {
        key: 'A',
        text: 'Aging: periodically boosting the priority of processes that have waited too long in lower queues',
        isCorrect: true,
      },
      { key: 'B', text: 'Setting time quantum to infinity', isCorrect: false },
      { key: 'C', text: 'Terminating long running processes', isCorrect: false },
      { key: 'D', text: 'Running all queues simultaneously', isCorrect: false },
    ],
    explanation:
      'Aging gradually increases the priority of long-waiting processes, ensuring they eventually reach high-priority queues and execute.',
    expectedTimeSeconds: 25,
    tags: ['os', 'cpu-scheduling', 'mlfq'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is Direct Memory Access (DMA)?',
    options: [
      {
        key: 'A',
        text: 'A specialized controller enabling hardware devices to transfer data directly to/from main memory without continuous CPU intervention',
        isCorrect: true,
      },
      { key: 'B', text: 'A pointer referencing memory directly in assembly', isCorrect: false },
      { key: 'C', text: 'Bypassing RAM to access CPU registers', isCorrect: false },
      { key: 'D', text: 'Overclocking system RAM', isCorrect: false },
    ],
    explanation:
      'DMA offloads bulk data transfers between I/O devices (e.g. NICs, disks) and RAM, generating an interrupt only when the entire transfer block finishes.',
    expectedTimeSeconds: 25,
    tags: ['os', 'dma', 'hardware'],
  },
  {
    topicSlug: 'os-concurrency',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a "Deadlock Detection" approach in operating systems?',
    options: [
      {
        key: 'A',
        text: 'Allowing the system to enter a deadlock, periodically running an algorithm to find cycles in resource allocation graphs, and recovering by aborting processes or preempting resources',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Preventing Coffman conditions statically at design time',
        isCorrect: false,
      },
      {
        key: 'C',
        text: "Refusing resource allocation requests dynamically using Banker's algorithm",
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Restarting the operating system on every mutex acquisition',
        isCorrect: false,
      },
    ],
    explanation:
      'Deadlock detection relies on periodic cycle-detection checks on resource graphs, followed by recovery actions such as process termination.',
    expectedTimeSeconds: 30,
    tags: ['os', 'deadlocks', 'detection'],
  },
];
