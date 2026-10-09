import { QuestionSeed } from './quant';

export const dsaQuestions: QuestionSeed[] = [
  // 1. Time Complexity & Big-O
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the time complexity of searching for an element in an unsorted array of size N?',
    options: [
      { key: 'A', text: 'O(1)', isCorrect: false },
      { key: 'B', text: 'O(log N)', isCorrect: false },
      { key: 'C', text: 'O(N)', isCorrect: true },
      { key: 'D', text: 'O(N log N)', isCorrect: false },
    ],
    explanation:
      'In an unsorted array, linear search requires examining each element sequentially in the worst case, yielding O(N) time complexity.',
    expectedTimeSeconds: 20,
    tags: ['big-o', 'arrays'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the worst-case time complexity of standard QuickSort when the pivot is always chosen as the first element of an already sorted array?',
    options: [
      { key: 'A', text: 'O(N log N)', isCorrect: false },
      { key: 'B', text: 'O(N^2)', isCorrect: true },
      { key: 'C', text: 'O(N)', isCorrect: false },
      { key: 'D', text: 'O(log N)', isCorrect: false },
    ],
    explanation:
      'Choosing the first element as pivot in an already sorted array yields an unbalanced partition of sizes 0 and N-1 at every step, degrading QuickSort to O(N^2) time complexity.',
    expectedTimeSeconds: 30,
    tags: ['sorting', 'quicksort'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the worst-case time complexity of MergeSort on an array of size N?',
    options: [
      { key: 'A', text: 'O(N log N)', isCorrect: true },
      { key: 'B', text: 'O(N^2)', isCorrect: false },
      { key: 'C', text: 'O(N)', isCorrect: false },
      { key: 'D', text: 'O(log N)', isCorrect: false },
    ],
    explanation:
      'MergeSort recursively splits the array into two halves (log N levels) and performs O(N) merging work at each level. Its worst, average, and best-case time complexity is consistently O(N log N).',
    expectedTimeSeconds: 25,
    tags: ['sorting', 'mergesort'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which sorting algorithm is guaranteed to be stable and has O(N log N) worst-case time complexity?',
    options: [
      { key: 'A', text: 'QuickSort', isCorrect: false },
      { key: 'B', text: 'HeapSort', isCorrect: false },
      { key: 'C', text: 'MergeSort', isCorrect: true },
      { key: 'D', text: 'SelectionSort', isCorrect: false },
    ],
    explanation:
      'MergeSort is a stable sorting algorithm that preserves the relative order of duplicate elements and maintains O(N log N) worst-case time complexity.',
    expectedTimeSeconds: 25,
    tags: ['sorting', 'stability'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the auxiliary space complexity of standard in-place HeapSort on an array of size N?',
    options: [
      { key: 'A', text: 'O(1)', isCorrect: true },
      { key: 'B', text: 'O(log N)', isCorrect: false },
      { key: 'C', text: 'O(N)', isCorrect: false },
      { key: 'D', text: 'O(N log N)', isCorrect: false },
    ],
    explanation:
      'HeapSort arranges the input array directly into an in-place binary heap, requiring only O(1) auxiliary space beyond the input array.',
    expectedTimeSeconds: 25,
    tags: ['sorting', 'heapsort', 'space-complexity'],
  },

  // 2. Arrays & Strings
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'In a 2D row-major order array A[M][N] stored in contiguous memory starting at base address B with element size S, what is the memory address of A[i][j] (0-indexed)?',
    options: [
      { key: 'A', text: 'B + (i * N + j) * S', isCorrect: true },
      { key: 'B', text: 'B + (j * M + i) * S', isCorrect: false },
      { key: 'C', text: 'B + (i * M + j) * S', isCorrect: false },
      { key: 'D', text: 'B + (i + j * N) * S', isCorrect: false },
    ],
    explanation:
      'In row-major ordering, each preceding row contains N elements. So index [i][j] skips i full rows (each of size N) plus j elements in the current row: B + (i * N + j) * S.',
    expectedTimeSeconds: 35,
    tags: ['arrays', 'memory-layout'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: "What is the minimum time complexity to find the maximum sum contiguous subarray in an array of size N (Kadane's Algorithm)?",
    options: [
      { key: 'A', text: 'O(N^2)', isCorrect: false },
      { key: 'B', text: 'O(N log N)', isCorrect: false },
      { key: 'C', text: 'O(N)', isCorrect: true },
      { key: 'D', text: 'O(1)', isCorrect: false },
    ],
    explanation:
      "Kadane's algorithm iterates through the array once maintaining currentMax = max(arr[i], currentMax + arr[i]), solving the problem in O(N) time and O(1) space.",
    expectedTimeSeconds: 25,
    tags: ['arrays', 'kadanes-algorithm'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which technique is optimal for checking if an array of characters contains a valid palindrome in O(N) time and O(1) extra space?',
    options: [
      { key: 'A', text: 'Two Pointers (converging from left and right)', isCorrect: true },
      { key: 'B', text: 'Push all characters to a stack and pop', isCorrect: false },
      { key: 'C', text: 'Build a suffix tree', isCorrect: false },
      { key: 'D', text: 'Matrix multiplication', isCorrect: false },
    ],
    explanation:
      'Using two pointers starting at indices 0 and N-1 moving inwards compares corresponding characters directly in O(N) time and O(1) auxiliary space.',
    expectedTimeSeconds: 20,
    tags: ['two-pointers', 'strings'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the time complexity of the Knuth-Morris-Pratt (KMP) pattern searching algorithm for text of length N and pattern of length M?',
    options: [
      { key: 'A', text: 'O(N * M)', isCorrect: false },
      { key: 'B', text: 'O(N + M)', isCorrect: true },
      { key: 'C', text: 'O(N log M)', isCorrect: false },
      { key: 'D', text: 'O(M log N)', isCorrect: false },
    ],
    explanation:
      'KMP precomputes the Longest Proper Prefix which is Suffix (LPS) array in O(M) time and scans the text without backtracking in O(N) time, giving O(N + M) total time.',
    expectedTimeSeconds: 30,
    tags: ['string-algorithms', 'kmp'],
  },

  // 3. Linked Lists
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which algorithm detects a cycle in a singly linked list in O(N) time and O(1) space?',
    options: [
      { key: 'A', text: "Floyd's Tortoise and Hare (Slow & Fast Pointers)", isCorrect: true },
      { key: 'B', text: 'Binary Search', isCorrect: false },
      { key: 'C', text: "Kruskal's Algorithm", isCorrect: false },
      { key: 'D', text: "Dijkstra's Algorithm", isCorrect: false },
    ],
    explanation:
      "Floyd's Cycle-Finding Algorithm uses two pointers: slow pointer advances 1 step and fast pointer advances 2 steps. If a cycle exists, they must meet within O(N) steps without allocating extra memory.",
    expectedTimeSeconds: 20,
    tags: ['linked-lists', 'cycle-detection'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In a singly linked list with head pointer only, what is the time complexity to delete a node given ONLY a pointer to that node (node is not the tail)?',
    options: [
      { key: 'A', text: 'O(N)', isCorrect: false },
      { key: 'B', text: 'O(1)', isCorrect: true },
      { key: 'C', text: 'O(log N)', isCorrect: false },
      { key: 'D', text: 'Cannot be done', isCorrect: false },
    ],
    explanation:
      'You can copy the value of node->next into node, and then update node->next = node->next->next, completing the deletion in O(1) time.',
    expectedTimeSeconds: 30,
    tags: ['linked-lists'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'How many pointer updates are required to reverse a singly linked list iteratively with 3 pointers (prev, curr, next)?',
    options: [
      { key: 'A', text: 'O(1) total updates', isCorrect: false },
      { key: 'B', text: 'O(N) total updates with 1 reversal per node', isCorrect: true },
      { key: 'C', text: 'O(N^2) updates', isCorrect: false },
      { key: 'D', text: 'O(log N) updates', isCorrect: false },
    ],
    explanation:
      'Each node is visited once and its next pointer is redirected to prev, requiring O(N) total operations.',
    expectedTimeSeconds: 20,
    tags: ['linked-lists'],
  },

  // 4. Stacks & Queues
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which data structure is fundamentally used by compilers to check balanced parentheses in source code?',
    options: [
      { key: 'A', text: 'Queue', isCorrect: false },
      { key: 'B', text: 'Stack', isCorrect: true },
      { key: 'C', text: 'Binary Heap', isCorrect: false },
      { key: 'D', text: 'Disjoint Set', isCorrect: false },
    ],
    explanation:
      'A stack obeys LIFO (Last-In First-Out), matching opening delimiters with the most recently encountered closing delimiter.',
    expectedTimeSeconds: 15,
    tags: ['stacks'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'How can a Queue be implemented using two Stacks S1 and S2 with amortized O(1) time per operation?',
    options: [
      {
        key: 'A',
        text: 'Push to S1; on dequeue, if S2 is empty, pop all elements from S1 and push to S2, then pop from S2',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Transfer elements back and forth on every push and pop',
        isCorrect: false,
      },
      { key: 'C', text: 'Push to S2 and pop from S1 without transfers', isCorrect: false },
      { key: 'D', text: 'It requires O(N) amortized time per operation', isCorrect: false },
    ],
    explanation:
      'Each element is pushed to S1 once, moved to S2 once, and popped from S2 once. Over N operations, total operations are 3N, achieving amortized O(1) per operation.',
    expectedTimeSeconds: 40,
    tags: ['stacks', 'queues'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the time complexity to find the Next Greater Element for all elements in an array using a Monotonic Stack?',
    options: [
      { key: 'A', text: 'O(N^2)', isCorrect: false },
      { key: 'B', text: 'O(N log N)', isCorrect: false },
      { key: 'C', text: 'O(N)', isCorrect: true },
      { key: 'D', text: 'O(log N)', isCorrect: false },
    ],
    explanation:
      'Each element in the array is pushed onto the stack once and popped at most once. Hence, total operations across the loop are 2N, giving linear O(N) time.',
    expectedTimeSeconds: 30,
    tags: ['monotonic-stack', 'stacks'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'In a circular queue implemented using an array of size N with front and rear pointers, what condition indicates that the queue is FULL?',
    options: [
      { key: 'A', text: 'front == rear', isCorrect: false },
      { key: 'B', text: '(rear + 1) % N == front', isCorrect: true },
      { key: 'C', text: 'rear == N - 1', isCorrect: false },
      { key: 'D', text: 'front == 0', isCorrect: false },
    ],
    explanation:
      'In standard circular queue array representations, full condition is when advancing rear by 1 position wraps around and hits front: (rear + 1) % N == front.',
    expectedTimeSeconds: 25,
    tags: ['queues', 'circular-queue'],
  },

  // 5. Binary Trees & BSTs
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which traversal of a Binary Search Tree (BST) visits nodes in strictly ascending sorted order?',
    options: [
      { key: 'A', text: 'Preorder traversal', isCorrect: false },
      { key: 'B', text: 'Inorder traversal', isCorrect: true },
      { key: 'C', text: 'Postorder traversal', isCorrect: false },
      { key: 'D', text: 'Level order traversal', isCorrect: false },
    ],
    explanation:
      'By BST definition, all nodes in the left subtree are smaller than root, and all nodes in the right subtree are greater. Inorder traversal (Left, Root, Right) yields sorted order.',
    expectedTimeSeconds: 20,
    tags: ['trees', 'bst'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the maximum number of nodes in a binary tree of height H (where a tree with a single root node has height 1)?',
    options: [
      { key: 'A', text: '2^H - 1', isCorrect: true },
      { key: 'B', text: '2^(H-1)', isCorrect: false },
      { key: 'C', text: '2^H + 1', isCorrect: false },
      { key: 'D', text: 'H^2', isCorrect: false },
    ],
    explanation: 'The sum of geometric progression 1 + 2 + 4 + ... + 2^(H-1) is 2^H - 1.',
    expectedTimeSeconds: 25,
    tags: ['trees', 'math'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In an AVL tree, what is the maximum permissible difference between the heights of the left and right subtrees of any node (Balance Factor)?',
    options: [
      { key: 'A', text: '0', isCorrect: false },
      { key: 'B', text: '1', isCorrect: true },
      { key: 'C', text: '2', isCorrect: false },
      { key: 'D', text: 'log N', isCorrect: false },
    ],
    explanation:
      'An AVL tree is a self-balancing BST where the balance factor (Height(left) - Height(right)) of every node must be in the set {-1, 0, 1}. The maximum difference is 1.',
    expectedTimeSeconds: 20,
    tags: ['avl-tree', 'balanced-trees'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree containing N nodes?',
    options: [
      { key: 'A', text: 'O(log N)', isCorrect: false },
      { key: 'B', text: 'O(N)', isCorrect: true },
      { key: 'C', text: 'O(1)', isCorrect: false },
      { key: 'D', text: 'O(N log N)', isCorrect: false },
    ],
    explanation:
      'If elements are inserted in sorted order, an unbalanced BST degrades into a skewed linked list with height N, resulting in O(N) search time.',
    expectedTimeSeconds: 20,
    tags: ['bst'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Given the preorder traversal [1, 2, 4, 5, 3] and inorder traversal [4, 2, 5, 1, 3], what is the root of the tree?',
    options: [
      { key: 'A', text: '1', isCorrect: true },
      { key: 'B', text: '4', isCorrect: false },
      { key: 'C', text: '3', isCorrect: false },
      { key: 'D', text: '2', isCorrect: false },
    ],
    explanation:
      'In preorder traversal (Root, Left, Right), the first element is always the root of the tree. Therefore, 1 is the root.',
    expectedTimeSeconds: 20,
    tags: ['trees', 'tree-traversal'],
  },

  // 6. Heaps & Priority Queues
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: "What is the time complexity to build a binary heap from an arbitrary array of N elements using bottom-up heapify (Floyd's algorithm)?",
    options: [
      { key: 'A', text: 'O(N log N)', isCorrect: false },
      { key: 'B', text: 'O(N)', isCorrect: true },
      { key: 'C', text: 'O(log N)', isCorrect: false },
      { key: 'D', text: 'O(N^2)', isCorrect: false },
    ],
    explanation:
      'Bottom-up heap construction runs in O(N) time because the majority of nodes are near the leaves and require fewer sift-down swaps (sum of h/2^h converges to a constant).',
    expectedTimeSeconds: 30,
    tags: ['heaps', 'complexity'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'In a 0-indexed binary max-heap stored in an array, what is the index of the left child of the node at index i?',
    options: [
      { key: 'A', text: '2 * i', isCorrect: false },
      { key: 'B', text: '2 * i + 1', isCorrect: true },
      { key: 'C', text: '2 * i + 2', isCorrect: false },
      { key: 'D', text: '(i - 1) / 2', isCorrect: false },
    ],
    explanation:
      'In 0-indexed array representation: left child is at 2*i + 1, right child is at 2*i + 2, and parent is at floor((i - 1) / 2).',
    expectedTimeSeconds: 20,
    tags: ['heaps'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the time complexity to extract the minimum element from a Min-Heap of size N?',
    options: [
      { key: 'A', text: 'O(1)', isCorrect: false },
      { key: 'B', text: 'O(log N)', isCorrect: true },
      { key: 'C', text: 'O(N)', isCorrect: false },
      { key: 'D', text: 'O(N log N)', isCorrect: false },
    ],
    explanation:
      'Extracting min replaces the root with the last leaf element and performs sift-down along the tree height, taking O(log N) time.',
    expectedTimeSeconds: 20,
    tags: ['heaps'],
  },

  // 7. Graphs
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which graph traversal algorithm uses a FIFO Queue data structure to visit vertices level by level?',
    options: [
      { key: 'A', text: 'Breadth-First Search (BFS)', isCorrect: true },
      { key: 'B', text: 'Depth-First Search (DFS)', isCorrect: false },
      { key: 'C', text: 'Bellman-Ford', isCorrect: false },
      { key: 'D', text: 'Floyd-Warshall', isCorrect: false },
    ],
    explanation:
      'BFS uses a FIFO queue to explore all immediate neighbors at distance d before moving to distance d+1.',
    expectedTimeSeconds: 15,
    tags: ['graphs', 'bfs'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the time complexity of Breadth-First Search (BFS) on a graph represented using an Adjacency List with V vertices and E edges?',
    options: [
      { key: 'A', text: 'O(V^2)', isCorrect: false },
      { key: 'B', text: 'O(V + E)', isCorrect: true },
      { key: 'C', text: 'O(E log V)', isCorrect: false },
      { key: 'D', text: 'O(V * E)', isCorrect: false },
    ],
    explanation:
      'Every vertex is enqueued/dequeued once (O(V)) and every outgoing edge in adjacency lists is traversed once in directed or twice in undirected graph (O(E)), giving O(V + E).',
    expectedTimeSeconds: 25,
    tags: ['graphs', 'bfs', 'complexity'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: "Why can Dijkstra's algorithm FAIL on graphs with negative edge weights?",
    options: [
      {
        key: 'A',
        text: 'It assumes that once a vertex is marked finalized/visited, its shortest distance cannot be improved by subsequent paths',
        isCorrect: true,
      },
      { key: 'B', text: 'It cannot be implemented with a priority queue', isCorrect: false },
      { key: 'C', text: 'It only works on trees', isCorrect: false },
      { key: 'D', text: 'It requires undirected graphs only', isCorrect: false },
    ],
    explanation:
      'Dijkstra greedily finalizes the minimum distance vertex assuming adding subsequent edges can only increase path length. Negative edges violate this non-decreasing path property.',
    expectedTimeSeconds: 40,
    tags: ['graphs', 'dijkstra'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which algorithm finds shortest paths from a single source in a graph with negative edge weights, and detects negative cycles?',
    options: [
      { key: 'A', text: "Dijkstra's Algorithm", isCorrect: false },
      { key: 'B', text: 'Bellman-Ford Algorithm', isCorrect: true },
      { key: 'C', text: "Prim's Algorithm", isCorrect: false },
      { key: 'D', text: "Kruskal's Algorithm", isCorrect: false },
    ],
    explanation:
      'The Bellman-Ford algorithm relaxes all E edges V-1 times. A V-th iteration that successfully relaxes any distance identifies a reachable negative weight cycle.',
    expectedTimeSeconds: 30,
    tags: ['graphs', 'bellman-ford'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Topological Sort can be performed on which class of graphs?',
    options: [
      { key: 'A', text: 'Any connected graph', isCorrect: false },
      { key: 'B', text: 'Directed Acyclic Graphs (DAG)', isCorrect: true },
      { key: 'C', text: 'Undirected cyclic graphs', isCorrect: false },
      { key: 'D', text: 'Complete bipartite graphs', isCorrect: false },
    ],
    explanation:
      'A topological ordering exists if and only if the graph has directed edges and contains no cycles (DAG).',
    expectedTimeSeconds: 20,
    tags: ['graphs', 'topological-sort'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which disjoint-set union (DSU) optimizations achieve near-constant amortized time complexity O(alpha(N)) per operation?',
    options: [
      { key: 'A', text: 'Union by Rank/Size and Path Compression', isCorrect: true },
      { key: 'B', text: 'Linear probing and quadratic probing', isCorrect: false },
      { key: 'C', text: 'Depth-first search and breadth-first search', isCorrect: false },
      { key: 'D', text: 'Binary lifting', isCorrect: false },
    ],
    explanation:
      'Combining Union by Rank (or Size) with Path Compression reduces the amortized cost per find/union operation to O(alpha(N)), where alpha is the inverse Ackermann function.',
    expectedTimeSeconds: 30,
    tags: ['dsu', 'disjoint-set'],
  },

  // 8. Hashing
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'In an open addressing hash table, what is the collision resolution technique where successive probes are spaced at intervals given by a secondary hash function?',
    options: [
      { key: 'A', text: 'Linear Probing', isCorrect: false },
      { key: 'B', text: 'Quadratic Probing', isCorrect: false },
      { key: 'C', text: 'Double Hashing', isCorrect: true },
      { key: 'D', text: 'Chaining', isCorrect: false },
    ],
    explanation:
      'Double hashing computes probe index h(k, i) = (h1(k) + i * h2(k)) % M, avoiding primary and secondary clustering.',
    expectedTimeSeconds: 25,
    tags: ['hashing'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the load factor alpha of a hash table with N elements stored in an array of M buckets?',
    options: [
      { key: 'A', text: 'M / N', isCorrect: false },
      { key: 'B', text: 'N / M', isCorrect: true },
      { key: 'C', text: 'N * M', isCorrect: false },
      { key: 'D', text: 'log(N / M)', isCorrect: false },
    ],
    explanation:
      'Load factor alpha = N / M, representing the average number of entries per bucket.',
    expectedTimeSeconds: 20,
    tags: ['hashing'],
  },

  // 9. Dynamic Programming
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What are the two essential properties a problem must possess for Dynamic Programming to be applicable?',
    options: [
      { key: 'A', text: 'Optimal Substructure and Overlapping Subproblems', isCorrect: true },
      { key: 'B', text: 'Greedy Choice and Independence', isCorrect: false },
      { key: 'C', text: 'Linearity and Convexity', isCorrect: false },
      { key: 'D', text: 'Associativity and Commutativity', isCorrect: false },
    ],
    explanation:
      'Dynamic programming requires that an optimal global solution can be constructed from optimal solutions to subproblems (Optimal Substructure) and that the same subproblems are solved repeatedly (Overlapping Subproblems).',
    expectedTimeSeconds: 25,
    tags: ['dynamic-programming'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the time and space complexity of the 0/1 Knapsack problem with N items and maximum weight capacity W using standard dynamic programming?',
    options: [
      { key: 'A', text: 'Time: O(N * W), Space: O(W)', isCorrect: true },
      { key: 'B', text: 'Time: O(2^N), Space: O(N)', isCorrect: false },
      { key: 'C', text: 'Time: O(N log W), Space: O(1)', isCorrect: false },
      { key: 'D', text: 'Time: O(W^2), Space: O(N)', isCorrect: false },
    ],
    explanation:
      'Standard DP solves 0/1 Knapsack in O(N * W) time. Since the recurrence for dp[w] depends only on values from the previous item iteration, space can be optimized to a 1D array of size O(W).',
    expectedTimeSeconds: 35,
    tags: ['dynamic-programming', 'knapsack'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the length of the Longest Common Subsequence (LCS) between strings "AGGTAB" and "GXTXAYB"?',
    options: [
      { key: 'A', text: '3', isCorrect: false },
      { key: 'B', text: '4', isCorrect: true },
      { key: 'C', text: '5', isCorrect: false },
      { key: 'D', text: '6', isCorrect: false },
    ],
    explanation:
      'The common subsequence is "GTAB" which has length 4: "A[G]G[T][A][B]" and "[G]X[T]X[A]Y[B]".',
    expectedTimeSeconds: 40,
    tags: ['dynamic-programming', 'lcs'],
  },
  {
    topicSlug: 'dsa',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'What is the 8th Fibonacci number where F(0) = 0, F(1) = 1, F(2) = 1, F(3) = 2, F(4) = 3...?',
    numericAnswer: 21,
    numericTolerance: 0,
    explanation: 'F(0)=0, F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5, F(6)=8, F(7)=13, F(8)=21.',
    expectedTimeSeconds: 20,
    tags: ['dynamic-programming', 'fibonacci'],
  },

  // 10. Additional Core DSA Problems
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In Binary Search on a sorted array of N elements, how many comparisons are made in the worst case?',
    options: [
      { key: 'A', text: 'floor(log2 N) + 1', isCorrect: true },
      { key: 'B', text: 'N / 2', isCorrect: false },
      { key: 'C', text: 'N', isCorrect: false },
      { key: 'D', text: 'log10 N', isCorrect: false },
    ],
    explanation:
      'Binary search halves the search space at each iteration. Maximum comparisons = floor(log2 N) + 1.',
    expectedTimeSeconds: 25,
    tags: ['binary-search'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the minimum number of edges in a connected undirected graph with V vertices?',
    options: [
      { key: 'A', text: 'V - 1', isCorrect: true },
      { key: 'B', text: 'V', isCorrect: false },
      { key: 'C', text: 'V * (V - 1) / 2', isCorrect: false },
      { key: 'D', text: '2 * V', isCorrect: false },
    ],
    explanation:
      'A connected graph with the minimum number of edges is a tree, which contains exactly V - 1 edges.',
    expectedTimeSeconds: 20,
    tags: ['graphs', 'trees'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which data structure supports both LIFO and FIFO operations efficiently at both ends in O(1) time?',
    options: [
      { key: 'A', text: 'Deque (Double-Ended Queue)', isCorrect: true },
      { key: 'B', text: 'Singly Linked List without tail pointer', isCorrect: false },
      { key: 'C', text: 'Binary Search Tree', isCorrect: false },
      { key: 'D', text: 'Heap', isCorrect: false },
    ],
    explanation:
      'A Deque (implemented via doubly linked list or circular dynamic buffer) supports insertion and deletion at both ends in O(1) time.',
    expectedTimeSeconds: 20,
    tags: ['queues', 'deque'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the time complexity of finding the Lowest Common Ancestor (LCA) of two nodes in a balanced Binary Tree of size N without parent pointers?',
    options: [
      { key: 'A', text: 'O(N)', isCorrect: true },
      { key: 'B', text: 'O(1)', isCorrect: false },
      { key: 'C', text: 'O(N^2)', isCorrect: false },
      { key: 'D', text: 'O(N!)', isCorrect: false },
    ],
    explanation:
      'In a regular binary tree (without BST property), finding LCA requires traversing the tree recursively to locate the nodes, taking O(N) time.',
    expectedTimeSeconds: 30,
    tags: ['trees', 'lca'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In an undirected graph, how can a cycle be detected during Depth-First Search (DFS)?',
    options: [
      {
        key: 'A',
        text: 'Encountering an adjacent visited vertex that is NOT the immediate parent of the current vertex',
        isCorrect: true,
      },
      { key: 'B', text: 'Encountering a leaf vertex', isCorrect: false },
      { key: 'C', text: 'Reaching the starting root vertex', isCorrect: false },
      { key: 'D', text: 'When the call stack depth exceeds V/2', isCorrect: false },
    ],
    explanation:
      'In an undirected graph, if a visited neighbor is reached that is not the parent from which the current node was traversed, a back-edge (cycle) exists.',
    expectedTimeSeconds: 30,
    tags: ['graphs', 'cycle-detection', 'dfs'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the maximum number of edges in a simple undirected planar graph with V >= 3 vertices?',
    options: [
      { key: 'A', text: '3V - 6', isCorrect: true },
      { key: 'B', text: 'V - 1', isCorrect: false },
      { key: 'C', text: 'V * (V - 1) / 2', isCorrect: false },
      { key: 'D', text: '2V', isCorrect: false },
    ],
    explanation:
      "By Euler's formula for planar graphs (V - E + F = 2) and the boundary inequality 2E >= 3F, substituting gives E <= 3V - 6.",
    expectedTimeSeconds: 35,
    tags: ['graphs', 'planar-graphs'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which sorting algorithm divides the array into sorted and unsorted partitions and repeatedly picks the minimum element from the unsorted partition?',
    options: [
      { key: 'A', text: 'Selection Sort', isCorrect: true },
      { key: 'B', text: 'Bubble Sort', isCorrect: false },
      { key: 'C', text: 'Insertion Sort', isCorrect: false },
      { key: 'D', text: 'Merge Sort', isCorrect: false },
    ],
    explanation:
      'Selection Sort repeatedly identifies the minimum element in the unsorted subarray and swaps it into the beginning of the unsorted segment.',
    expectedTimeSeconds: 20,
    tags: ['sorting'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the best-case time complexity of standard Insertion Sort on an already sorted array?',
    options: [
      { key: 'A', text: 'O(N)', isCorrect: true },
      { key: 'B', text: 'O(N log N)', isCorrect: false },
      { key: 'C', text: 'O(N^2)', isCorrect: false },
      { key: 'D', text: 'O(1)', isCorrect: false },
    ],
    explanation:
      'If the array is already sorted, each element compares with its immediate predecessor once and the inner loop terminates immediately, giving O(N) comparisons and 0 swaps.',
    expectedTimeSeconds: 20,
    tags: ['sorting', 'insertion-sort'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which data structure is most efficient to maintain a sliding window maximum of size K across an array of size N in O(N) total time?',
    options: [
      {
        key: 'A',
        text: 'Monotonic Deque (indices stored in decreasing value order)',
        isCorrect: true,
      },
      { key: 'B', text: 'Binary Search Tree', isCorrect: false },
      { key: 'C', text: 'Stack', isCorrect: false },
      { key: 'D', text: 'Min-Heap', isCorrect: false },
    ],
    explanation:
      'A monotonic double-ended queue stores potential maximum indices. Out-of-window and smaller elements are popped in amortized O(1) per step, processing all N elements in O(N) time.',
    expectedTimeSeconds: 35,
    tags: ['sliding-window', 'deque'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the space complexity of Depth-First Search on a balanced tree with N nodes?',
    options: [
      { key: 'A', text: 'O(log N)', isCorrect: true },
      { key: 'B', text: 'O(N)', isCorrect: false },
      { key: 'C', text: 'O(1)', isCorrect: false },
      { key: 'D', text: 'O(N log N)', isCorrect: false },
    ],
    explanation:
      'The recursion call stack depth corresponds to the tree height. For a balanced tree with N nodes, height H = O(log N).',
    expectedTimeSeconds: 20,
    tags: ['trees', 'dfs', 'space-complexity'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the time complexity of checking if a number N is prime using the trial division method up to sqrt(N)?',
    options: [
      { key: 'A', text: 'O(sqrt(N))', isCorrect: true },
      { key: 'B', text: 'O(N)', isCorrect: false },
      { key: 'C', text: 'O(log N)', isCorrect: false },
      { key: 'D', text: 'O(1)', isCorrect: false },
    ],
    explanation:
      'If N has a factor greater than sqrt(N), its corresponding paired factor must be less than or equal to sqrt(N). Checking divisors up to sqrt(N) runs in O(sqrt(N)) time.',
    expectedTimeSeconds: 20,
    tags: ['math', 'prime-checking'],
  },
  {
    topicSlug: 'dsa',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'How many leaves does a full binary tree with 15 total nodes have?',
    numericAnswer: 8,
    numericTolerance: 0,
    explanation:
      'In a full binary tree with L leaves and I internal nodes, L = I + 1. Total nodes N = L + I = 2L - 1. Thus 15 = 2L - 1 => 2L = 16 => L = 8.',
    expectedTimeSeconds: 25,
    tags: ['trees', 'binary-tree'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the value of 5! (5 factorial)?',
    options: [
      { key: 'A', text: '120', isCorrect: true },
      { key: 'B', text: '60', isCorrect: false },
      { key: 'C', text: '24', isCorrect: false },
      { key: 'D', text: '720', isCorrect: false },
    ],
    explanation: '5! = 5 * 4 * 3 * 2 * 1 = 120.',
    expectedTimeSeconds: 10,
    tags: ['recursion', 'math'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: "In Kruskal's Minimum Spanning Tree algorithm, which data structure is used to detect cycles efficiently?",
    options: [
      { key: 'A', text: 'Disjoint Set Union (Union-Find)', isCorrect: true },
      { key: 'B', text: 'Binary Search Tree', isCorrect: false },
      { key: 'C', text: 'FIFO Queue', isCorrect: false },
      { key: 'D', text: 'Trie', isCorrect: false },
    ],
    explanation:
      "Kruskal's algorithm sorts edges by weight and uses Disjoint Set Union (DSU) to check whether adding an edge connects two previously disconnected components without forming a cycle.",
    expectedTimeSeconds: 25,
    tags: ['mst', 'kruskal', 'dsu'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: "What is the time complexity of Prim's algorithm using an Adjacency List and a Min-Heap (Priority Queue)?",
    options: [
      { key: 'A', text: 'O(E log V)', isCorrect: true },
      { key: 'B', text: 'O(V^2)', isCorrect: false },
      { key: 'C', text: 'O(V log E)', isCorrect: false },
      { key: 'D', text: 'O(E + V)', isCorrect: false },
    ],
    explanation:
      "Prim's algorithm with binary heap performs V delete-mins (O(V log V)) and at most E key decreases/inserts (O(E log V)), giving O(E log V) total runtime.",
    expectedTimeSeconds: 30,
    tags: ['mst', 'prims-algorithm'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the time complexity of inserting a word of length L into a Trie containing N words?',
    options: [
      { key: 'A', text: 'O(L)', isCorrect: true },
      { key: 'B', text: 'O(N)', isCorrect: false },
      { key: 'C', text: 'O(N * L)', isCorrect: false },
      { key: 'D', text: 'O(log N)', isCorrect: false },
    ],
    explanation:
      'Trie insertion traverses or creates at most one child node per character in the word of length L. The operation depends solely on the word length L, O(L).',
    expectedTimeSeconds: 20,
    tags: ['trie', 'string-algorithms'],
  },
  {
    topicSlug: 'dsa',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which sorting algorithm has a lower bound of Omega(N log N) for comparison-based sorting of N elements?',
    options: [
      { key: 'A', text: 'All comparison-based sorting algorithms', isCorrect: true },
      { key: 'B', text: 'Only QuickSort', isCorrect: false },
      { key: 'C', text: 'Only MergeSort', isCorrect: false },
      { key: 'D', text: 'Only HeapSort', isCorrect: false },
    ],
    explanation:
      'Any comparison-based sort corresponds to a decision tree with N! leaves. Minimum tree height is ceil(log2(N!)) = Omega(N log N). Non-comparison sorts like RadixSort can surpass this.',
    expectedTimeSeconds: 30,
    tags: ['sorting', 'theory'],
  },
];
