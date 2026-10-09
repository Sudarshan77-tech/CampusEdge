import { QuestionSeed } from './quant';

export const networkQuestions: QuestionSeed[] = [
  // 1. OSI & TCP/IP Model
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the correct order of the 7 layers in the OSI Reference Model from bottom to top (Layer 1 to Layer 7)?',
    options: [
      {
        key: 'A',
        text: 'Physical, Data Link, Network, Transport, Session, Presentation, Application',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Application, Presentation, Session, Transport, Network, Data Link, Physical',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Physical, Network, Data Link, Transport, Application, Session, Presentation',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Data Link, Physical, Network, Transport, Presentation, Session, Application',
        isCorrect: false,
      },
    ],
    explanation:
      'From lowest physical transmission medium to user application: Layer 1 Physical, 2 Data Link, 3 Network, 4 Transport, 5 Session, 6 Presentation, 7 Application.',
    expectedTimeSeconds: 20,
    tags: ['networks', 'osi-model'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the Protocol Data Unit (PDU) at the Transport Layer (Layer 4) of the OSI model called?',
    options: [
      { key: 'A', text: 'Segment (or Datagram)', isCorrect: true },
      { key: 'B', text: 'Packet', isCorrect: false },
      { key: 'C', text: 'Frame', isCorrect: false },
      { key: 'D', text: 'Bit', isCorrect: false },
    ],
    explanation:
      'PDUs by layer: Layer 1 = Bits, Layer 2 = Frames, Layer 3 = Packets, Layer 4 = Segments (TCP) or Datagrams (UDP), Layers 5-7 = Data.',
    expectedTimeSeconds: 15,
    tags: ['networks', 'osi-model', 'pdu'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'At which OSI layer does an IP Router primarily operate?',
    options: [
      { key: 'A', text: 'Layer 3 (Network Layer)', isCorrect: true },
      { key: 'B', text: 'Layer 2 (Data Link Layer)', isCorrect: false },
      { key: 'C', text: 'Layer 4 (Transport Layer)', isCorrect: false },
      { key: 'D', text: 'Layer 7 (Application Layer)', isCorrect: false },
    ],
    explanation:
      'Routers inspect IP header information to forward packets between disparate subnets at Layer 3 (Network Layer). Switches operate primarily at Layer 2.',
    expectedTimeSeconds: 15,
    tags: ['networks', 'router', 'osi-model'],
  },

  // 2. Data Link Layer & Addressing
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the standard length of an Ethernet MAC (Media Access Control) address?',
    options: [
      { key: 'A', text: '48 bits (6 bytes)', isCorrect: true },
      { key: 'B', text: '32 bits (4 bytes)', isCorrect: false },
      { key: 'C', text: '64 bits (8 bytes)', isCorrect: false },
      { key: 'D', text: '128 bits (16 bytes)', isCorrect: false },
    ],
    explanation:
      'MAC addresses are 48 bits long, represented as 12 hexadecimal digits (e.g. 00:1A:2B:3C:4D:5E).',
    expectedTimeSeconds: 15,
    tags: ['networks', 'mac-address'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What protocol resolves an IP address to a physical MAC address on a local area network?',
    options: [
      { key: 'A', text: 'Address Resolution Protocol (ARP)', isCorrect: true },
      { key: 'B', text: 'Domain Name System (DNS)', isCorrect: false },
      { key: 'C', text: 'Dynamic Host Configuration Protocol (DHCP)', isCorrect: false },
      { key: 'D', text: 'Internet Control Message Protocol (ICMP)', isCorrect: false },
    ],
    explanation:
      'ARP broadcasts an ARP Request query asking "Who has IP X?" and receives an ARP Reply containing the target host\'s MAC address.',
    expectedTimeSeconds: 20,
    tags: ['networks', 'arp'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In CSMA/CD (Carrier Sense Multiple Access with Collision Detection), what does a node do when it detects a transmission collision?',
    options: [
      {
        key: 'A',
        text: 'Transmits a jam signal and waits for a random period using the binary exponential backoff algorithm before retrying',
        isCorrect: true,
      },
      { key: 'B', text: 'Immediately retransmits at maximum signal strength', isCorrect: false },
      { key: 'C', text: 'Disconnects from the network', isCorrect: false },
      { key: 'D', text: 'Requests a token from the ring master', isCorrect: false },
    ],
    explanation:
      'When collision is detected, the transmitting host aborts transmission, broadcasts a 32-bit jam signal to notify other stations, and enters truncated binary exponential backoff.',
    expectedTimeSeconds: 30,
    tags: ['networks', 'csmacd', 'ethernet'],
  },

  // 3. Network Layer & IP Addressing
  {
    topicSlug: 'networks',
    type: 'NUMERIC',
    difficulty: 3,
    stem: 'How many usable host IP addresses are available in a subnet with CIDR prefix /26?',
    numericAnswer: 62,
    numericTolerance: 0,
    explanation:
      'In /26, 32 - 26 = 6 host bits. Total addresses = 2^6 = 64. Subtracting network address (all 0s) and broadcast address (all 1s) gives 64 - 2 = 62 usable host addresses.',
    expectedTimeSeconds: 25,
    tags: ['networks', 'subnetting', 'cidr'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which of the following is an RFC 1918 Private IPv4 address range reserved for internal networks?',
    options: [
      { key: 'A', text: '192.168.0.0/16', isCorrect: true },
      { key: 'B', text: '8.8.8.0/24', isCorrect: false },
      { key: 'C', text: '127.0.0.0/8', isCorrect: false },
      { key: 'D', text: '169.254.0.0/16', isCorrect: false },
    ],
    explanation:
      'RFC 1918 defines three private ranges: 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16. (127.0.0.0/8 is loopback, 169.254.0.0/16 is link-local).',
    expectedTimeSeconds: 20,
    tags: ['networks', 'ipv4', 'private-ip'],
  },
  {
    topicSlug: 'networks',
    type: 'NUMERIC',
    difficulty: 2,
    stem: 'What is the length in bits of an IPv6 address?',
    numericAnswer: 128,
    numericTolerance: 0,
    explanation:
      'IPv6 addresses are 128 bits long (compared to 32 bits for IPv4), written as 8 groups of 4 hexadecimal characters separated by colons.',
    expectedTimeSeconds: 15,
    tags: ['networks', 'ipv6'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'How does the `traceroute` utility identify intermediate routers along a network path?',
    options: [
      {
        key: 'A',
        text: 'By sending packets with incrementally increasing Time-To-Live (TTL) values starting from 1 and listening for ICMP Time Exceeded messages',
        isCorrect: true,
      },
      { key: 'B', text: 'By querying DNS servers along the path', isCorrect: false },
      { key: 'C', text: 'By establishing SSH tunnels with each router', isCorrect: false },
      { key: 'D', text: 'By using ARP broadcast flooding', isCorrect: false },
    ],
    explanation:
      'Traceroute sets TTL=1; router 1 decrements TTL to 0 and drops the packet, sending back an ICMP Time Exceeded (Type 11) message. Incrementing TTL uncovers successive hops.',
    expectedTimeSeconds: 30,
    tags: ['networks', 'traceroute', 'icmp'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: "Which routing protocol is an interior gateway protocol based on Dijkstra's Link-State algorithm?",
    options: [
      { key: 'A', text: 'OSPF (Open Shortest Path First)', isCorrect: true },
      { key: 'B', text: 'RIP (Routing Information Protocol)', isCorrect: false },
      { key: 'C', text: 'BGP (Border Gateway Protocol)', isCorrect: false },
      { key: 'D', text: 'EGP (Exterior Gateway Protocol)', isCorrect: false },
    ],
    explanation:
      "OSPF floods link-state advertisements (LSAs) and uses Dijkstra's shortest path algorithm to compute optimal routing tables within an autonomous system.",
    expectedTimeSeconds: 25,
    tags: ['networks', 'routing', 'ospf'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the primary routing protocol used to route traffic across disparate Autonomous Systems on the global Internet backbone?',
    options: [
      { key: 'A', text: 'BGP (Border Gateway Protocol)', isCorrect: true },
      { key: 'B', text: 'RIP', isCorrect: false },
      { key: 'C', text: 'OSPF', isCorrect: false },
      { key: 'D', text: 'IS-IS', isCorrect: false },
    ],
    explanation:
      'BGP is a Path-Vector Exterior Gateway Protocol that manages reachability information between autonomous systems (ASes) worldwide.',
    expectedTimeSeconds: 25,
    tags: ['networks', 'bgp', 'internet-routing'],
  },

  // 4. Transport Layer: TCP & UDP
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What sequence of flag packets establishes a standard TCP connection (Three-Way Handshake)?',
    options: [
      { key: 'A', text: 'SYN -> SYN-ACK -> ACK', isCorrect: true },
      { key: 'B', text: 'ACK -> SYN -> SYN-ACK', isCorrect: false },
      { key: 'C', text: 'SYN -> ACK -> DATA', isCorrect: false },
      { key: 'D', text: 'FIN -> ACK -> FIN-ACK', isCorrect: false },
    ],
    explanation:
      'Client sends SYN; Server responds with SYN-ACK acknowledging client sequence number and proposing its own; Client responds with ACK.',
    expectedTimeSeconds: 20,
    tags: ['networks', 'tcp', 'three-way-handshake'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Why does the TCP connection termination state machine include a `TIME_WAIT` state (usually lasting 2 * MSL)?',
    options: [
      {
        key: 'A',
        text: 'To ensure the final ACK is reliably delivered to the remote peer, and to let lingering duplicate segments from the connection drain from the network before port reuse',
        isCorrect: true,
      },
      { key: 'B', text: 'To encrypt remaining session logs', isCorrect: false },
      { key: 'C', text: 'To allow the server to recharge its CPU', isCorrect: false },
      { key: 'D', text: 'To renegotiate MTU size', isCorrect: false },
    ],
    explanation:
      'TIME_WAIT prevents old delayed packets from being misdelivered to a new connection using the same 4-tuple (src IP, src port, dst IP, dst port), and allows retransmitting the final ACK if lost.',
    expectedTimeSeconds: 35,
    tags: ['networks', 'tcp', 'time-wait'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the primary difference between Flow Control and Congestion Control in TCP?',
    options: [
      {
        key: 'A',
        text: "Flow control prevents sender from overwhelming the receiver's buffer (using Receive Window); Congestion control prevents sender from overwhelming the intervening network links and routers (using Congestion Window)",
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Flow control uses UDP while congestion control uses TCP',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Flow control is managed by routers; congestion control is managed by hosts',
        isCorrect: false,
      },
      { key: 'D', text: 'They are identical mechanisms with different names', isCorrect: false },
    ],
    explanation:
      'Flow control is end-to-end between sender and receiver (governed by advertised rwnd). Congestion control is network-oriented (governed by cwnd calculated via loss/delay feedback).',
    expectedTimeSeconds: 35,
    tags: ['networks', 'tcp', 'flow-control', 'congestion-control'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In TCP congestion control, what happens during the "Slow Start" phase upon receipt of each ACK?',
    options: [
      {
        key: 'A',
        text: 'Congestion window (cwnd) increases exponentially by 1 MSS for every ACK received (effectively doubling cwnd per Round-Trip Time)',
        isCorrect: true,
      },
      { key: 'B', text: 'cwnd increases linearly by 1 MSS per RTT', isCorrect: false },
      { key: 'C', text: 'cwnd drops to zero', isCorrect: false },
      { key: 'D', text: 'Transmission rate slows down to minimum', isCorrect: false },
    ],
    explanation:
      'Despite the name "Slow Start", the congestion window grows exponentially (doubles each RTT) until it reaches slow start threshold (ssthresh).',
    expectedTimeSeconds: 30,
    tags: ['networks', 'tcp', 'slow-start'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What triggers "Fast Retransmit" in TCP without waiting for a retransmission timeout (RTO)?',
    options: [
      {
        key: 'A',
        text: 'Receipt of 3 duplicate ACKs for the same sequence number',
        isCorrect: true,
      },
      { key: 'B', text: 'Receipt of an ICMP host unreachable message', isCorrect: false },
      { key: 'C', text: 'Loss of a DNS query packet', isCorrect: false },
      { key: 'D', text: 'Expiration of the keepalive timer', isCorrect: false },
    ],
    explanation:
      'When 3 duplicate ACKs arrive, TCP infers that the segment following the acknowledged sequence was lost in transit and immediately retransmits it without waiting for RTO timer expiry.',
    expectedTimeSeconds: 25,
    tags: ['networks', 'tcp', 'fast-retransmit'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which protocol is connectionless, unreliable, has an 8-byte header, and is preferred for real-time streaming and VoIP?',
    options: [
      { key: 'A', text: 'User Datagram Protocol (UDP)', isCorrect: true },
      { key: 'B', text: 'Transmission Control Protocol (TCP)', isCorrect: false },
      { key: 'C', text: 'Internet Protocol (IP)', isCorrect: false },
      { key: 'D', text: 'Border Gateway Protocol (BGP)', isCorrect: false },
    ],
    explanation:
      'UDP provides minimal overhead (8 bytes), low latency without connection establishment or head-of-line blocking, making it ideal for voice/video and gaming.',
    expectedTimeSeconds: 15,
    tags: ['networks', 'udp'],
  },

  // 5. Application Layer: HTTP, DNS, TLS
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which DNS record type maps a domain name directly to an IPv4 address?',
    options: [
      { key: 'A', text: 'A Record', isCorrect: true },
      { key: 'B', text: 'AAAA Record', isCorrect: false },
      { key: 'C', text: 'CNAME Record', isCorrect: false },
      { key: 'D', text: 'MX Record', isCorrect: false },
    ],
    explanation:
      'An "A" record maps hostname to IPv4 address; "AAAA" maps to IPv6; "CNAME" aliases to canonical name; "MX" specifies mail exchange servers.',
    expectedTimeSeconds: 15,
    tags: ['networks', 'dns'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What major performance improvement was introduced in HTTP/2 compared to HTTP/1.1?',
    options: [
      {
        key: 'A',
        text: 'Binary framing and stream multiplexing over a single TCP connection, eliminating application-level head-of-line blocking',
        isCorrect: true,
      },
      { key: 'B', text: 'Replacing TCP with UDP entirely', isCorrect: false },
      { key: 'C', text: 'Removing SSL/TLS encryption requirements', isCorrect: false },
      { key: 'D', text: 'Deprecating JSON in favor of XML', isCorrect: false },
    ],
    explanation:
      'HTTP/2 introduces a binary framing layer that multiplexes concurrent bidirectional streams over a single TCP connection, avoiding HTTP/1.1 pipelining limitations.',
    expectedTimeSeconds: 30,
    tags: ['networks', 'http2'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What underlying transport protocol is used by HTTP/3 to eliminate TCP-level head-of-line blocking across lossy networks?',
    options: [
      { key: 'A', text: 'QUIC (running over UDP)', isCorrect: true },
      { key: 'B', text: 'SCTP', isCorrect: false },
      { key: 'C', text: 'Raw IP sockets', isCorrect: false },
      { key: 'D', text: 'WebSocket', isCorrect: false },
    ],
    explanation:
      'HTTP/3 runs over QUIC, a transport protocol built on top of UDP with integrated TLS 1.3 encryption and independent stream multiplexing.',
    expectedTimeSeconds: 25,
    tags: ['networks', 'http3', 'quic'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In a modern TLS 1.3 handshake, how are session keys negotiated securely between client and server?',
    options: [
      {
        key: 'A',
        text: 'Ephemeral Diffie-Hellman key exchange (ECDHE), providing Perfect Forward Secrecy',
        isCorrect: true,
      },
      { key: 'B', text: 'Server sends its private RSA key to client directly', isCorrect: false },
      { key: 'C', text: 'Plaintext symmetric keys sent in HTTP headers', isCorrect: false },
      { key: 'D', text: 'DNS TXT records', isCorrect: false },
    ],
    explanation:
      'TLS 1.3 mandates (EC)DHE key exchange for session key derivation, ensuring that compromise of server long-term private keys cannot decrypt past recorded sessions (PFS).',
    expectedTimeSeconds: 35,
    tags: ['networks', 'tls', 'cryptography'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the default TCP port used for secure HTTPS traffic?',
    options: [
      { key: 'A', text: '443', isCorrect: true },
      { key: 'B', text: '80', isCorrect: false },
      { key: 'C', text: '8080', isCorrect: false },
      { key: 'D', text: '22', isCorrect: false },
    ],
    explanation: 'Standard well-known ports: HTTP = 80, HTTPS = 443, SSH = 22, DNS = 53.',
    expectedTimeSeconds: 10,
    tags: ['networks', 'ports'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is Network Address Translation (NAT) primarily used for in IPv4 networks?',
    options: [
      {
        key: 'A',
        text: 'Allowing multiple private IP devices on a LAN to share a single public IPv4 address to access the Internet',
        isCorrect: true,
      },
      { key: 'B', text: 'Compressing IP packets for faster bandwidth', isCorrect: false },
      { key: 'C', text: 'Encrypting data packets at Layer 3', isCorrect: false },
      { key: 'D', text: 'Assigning domain names to servers', isCorrect: false },
    ],
    explanation:
      'NAT maps private (RFC 1918) IP addresses and port numbers to a public IP address, mitigating IPv4 address exhaustion.',
    expectedTimeSeconds: 25,
    tags: ['networks', 'nat'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What type of cyberattack floods a target server with TCP SYN packets without ever completing the handshake with final ACKs, exhausting server connection queues?',
    options: [
      { key: 'A', text: 'TCP SYN Flood Attack', isCorrect: true },
      { key: 'B', text: 'SQL Injection', isCorrect: false },
      { key: 'C', text: 'Cross-Site Scripting (XSS)', isCorrect: false },
      { key: 'D', text: 'Buffer Overflow', isCorrect: false },
    ],
    explanation:
      "A SYN Flood exhausts the server's backlog queue (SYN queue) with half-open connections. Mitigated using SYN Cookies.",
    expectedTimeSeconds: 20,
    tags: ['networks', 'cybersecurity', 'syn-flood'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the Maximum Transmission Unit (MTU) of standard Ethernet?',
    options: [
      { key: 'A', text: '1500 bytes', isCorrect: true },
      { key: 'B', text: '512 bytes', isCorrect: false },
      { key: 'C', text: '65535 bytes', isCorrect: false },
      { key: 'D', text: '9000 bytes', isCorrect: false },
    ],
    explanation:
      'Standard Ethernet specifies an MTU of 1500 bytes as the maximum payload size of an Ethernet frame (excluding headers). Frames exceeding this trigger IP fragmentation or PMTUD.',
    expectedTimeSeconds: 20,
    tags: ['networks', 'mtu', 'ethernet'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What mechanism prevents IP packets from circulating indefinitely in routing loops?',
    options: [
      {
        key: 'A',
        text: 'Time-To-Live (TTL) field in IPv4 (Hop Limit in IPv6), decremented by 1 at each router hop until discarded at 0',
        isCorrect: true,
      },
      { key: 'B', text: 'Checksum verification', isCorrect: false },
      { key: 'C', text: 'TCP sequence numbers', isCorrect: false },
      { key: 'D', text: 'DNS expiration timers', isCorrect: false },
    ],
    explanation:
      'Every router decrements the TTL/Hop Limit field by 1. When it reaches 0, the packet is discarded and an ICMP Time Exceeded packet is returned.',
    expectedTimeSeconds: 25,
    tags: ['networks', 'ttl', 'routing'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'Which protocol dynamically assigns IP addresses, subnet masks, and default gateways to client devices joining a local network?',
    options: [
      { key: 'A', text: 'Dynamic Host Configuration Protocol (DHCP)', isCorrect: true },
      { key: 'B', text: 'Simple Network Management Protocol (SNMP)', isCorrect: false },
      { key: 'C', text: 'Internet Group Management Protocol (IGMP)', isCorrect: false },
      { key: 'D', text: 'Post Office Protocol (POP3)', isCorrect: false },
    ],
    explanation:
      'DHCP automates network parameter configuration via the DORA sequence: Discover, Offer, Request, Acknowledge.',
    expectedTimeSeconds: 20,
    tags: ['networks', 'dhcp'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the Subnet Mask `255.255.255.0`?',
    options: [
      {
        key: 'A',
        text: 'To divide an IP address into a 24-bit Network ID prefix and an 8-bit Host ID portion',
        isCorrect: true,
      },
      { key: 'B', text: 'To encrypt IP packets', isCorrect: false },
      { key: 'C', text: 'To assign priority to video traffic', isCorrect: false },
      { key: 'D', text: 'To route packets through public DNS', isCorrect: false },
    ],
    explanation:
      'A bitwise AND between an IP address and 255.255.255.0 separates the first 24 bits (network portion) from the remaining 8 bits (host portion).',
    expectedTimeSeconds: 20,
    tags: ['networks', 'subnet-mask'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is a "Socket" in network programming?',
    options: [
      {
        key: 'A',
        text: 'An endpoint for communication uniquely defined by the combination of an IP address and a Port Number (plus transport protocol)',
        isCorrect: true,
      },
      { key: 'B', text: 'A physical connector on the motherboard', isCorrect: false },
      { key: 'C', text: 'A software plugin for web browsers', isCorrect: false },
      { key: 'D', text: 'A cryptographic key pair', isCorrect: false },
    ],
    explanation:
      'A network socket represents an IPC communication endpoint identified by (IP address, port number, protocol).',
    expectedTimeSeconds: 20,
    tags: ['networks', 'sockets'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the HTTP Status Code `429 Too Many Requests`?',
    options: [
      {
        key: 'A',
        text: 'The user has sent too many requests in a given amount of time (rate limiting)',
        isCorrect: true,
      },
      { key: 'B', text: 'The requested resource was not found on the server', isCorrect: false },
      { key: 'C', text: 'The server suffered an unhandled internal exception', isCorrect: false },
      { key: 'D', text: 'Authentication credentials are invalid', isCorrect: false },
    ],
    explanation:
      'HTTP 429 indicates that rate limits have been exceeded, often returned with a `Retry-After` header indicating how long to wait.',
    expectedTimeSeconds: 15,
    tags: ['networks', 'http-status-codes', 'rate-limiting'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the role of a Reverse Proxy (such as Nginx or Envoy) in modern web architectures?',
    options: [
      {
        key: 'A',
        text: 'Sitting in front of backend web servers to route requests, terminate SSL/TLS, load balance traffic, and provide caching',
        isCorrect: true,
      },
      { key: 'B', text: 'Hiding client IP addresses when browsing the web', isCorrect: false },
      { key: 'C', text: 'Managing hard drive disk sectors', isCorrect: false },
      { key: 'D', text: 'Compiling TypeScript code into JavaScript', isCorrect: false },
    ],
    explanation:
      'A reverse proxy intercepts inbound Internet requests and dispatches them to appropriate backend instances, providing SSL offloading, rate limiting, and caching.',
    expectedTimeSeconds: 25,
    tags: ['networks', 'reverse-proxy', 'system-design'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the difference between Symmetric and Asymmetric Encryption?',
    options: [
      {
        key: 'A',
        text: 'Symmetric encryption uses the same shared key for encryption and decryption; Asymmetric encryption uses a mathematically linked public-private key pair',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Asymmetric encryption is much faster for encrypting large gigabyte files than symmetric encryption',
        isCorrect: false,
      },
      { key: 'C', text: 'Symmetric encryption cannot be decrypted', isCorrect: false },
      { key: 'D', text: 'Symmetric is only used for passwords', isCorrect: false },
    ],
    explanation:
      'Symmetric ciphers (e.g. AES-GCM) are fast and share one key. Asymmetric ciphers (e.g. RSA, ECC) use public/private pairs and are used for key exchange and digital signatures.',
    expectedTimeSeconds: 25,
    tags: ['networks', 'cryptography'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'Which header field in an IPv4 packet specifies the encapsulated Layer 4 protocol (e.g., TCP=6, UDP=17, ICMP=1)?',
    options: [
      { key: 'A', text: 'Protocol field', isCorrect: true },
      { key: 'B', text: 'Type of Service (ToS)', isCorrect: false },
      { key: 'C', text: 'Identification', isCorrect: false },
      { key: 'D', text: 'Flags', isCorrect: false },
    ],
    explanation:
      'The 8-bit Protocol field in the IPv4 header defines the transport layer protocol payload (6 for TCP, 17 for UDP, 1 for ICMP).',
    expectedTimeSeconds: 20,
    tags: ['networks', 'ip-header'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 2,
    stem: 'What is the function of the ICMP protocol (Internet Control Message Protocol)?',
    options: [
      {
        key: 'A',
        text: 'To send operational error messages and diagnostic information about network connectivity (e.g. Destination Unreachable, Echo Request)',
        isCorrect: true,
      },
      { key: 'B', text: 'To transfer web pages securely', isCorrect: false },
      { key: 'C', text: 'To stream video without lag', isCorrect: false },
      { key: 'D', text: 'To assign IP addresses dynamically', isCorrect: false },
    ],
    explanation:
      'ICMP is a network layer supporting protocol used by devices to report transmission errors and diagnostic conditions (such as ping ping Echo Request/Reply).',
    expectedTimeSeconds: 20,
    tags: ['networks', 'icmp'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'What is the purpose of the Window Scale option in modern TCP implementations?',
    options: [
      {
        key: 'A',
        text: 'To scale the 16-bit window field up to 30 bits (1 GB), enabling high-throughput data transfer over Long Fat Networks (LFN)',
        isCorrect: true,
      },
      { key: 'B', text: 'To resize the browser window automatically', isCorrect: false },
      { key: 'C', text: 'To compress text payload in packets', isCorrect: false },
      { key: 'D', text: 'To increase the MTU of Ethernet', isCorrect: false },
    ],
    explanation:
      'Standard TCP headers have only 16 bits for receive window (max 65,535 bytes). Window Scale shifts this value, allowing gigabyte windows needed for high bandwidth-delay product links.',
    expectedTimeSeconds: 30,
    tags: ['networks', 'tcp', 'window-scale'],
  },
  {
    topicSlug: 'networks',
    type: 'MCQ_SINGLE',
    difficulty: 3,
    stem: 'In DNS resolution, what is the difference between a Recursive query and an Iterative query?',
    options: [
      {
        key: 'A',
        text: 'In a recursive query, the contacted server assumes full responsibility to resolve and return the final answer; in an iterative query, the server returns the best referral to the next nameserver down the hierarchy',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Recursive queries use TCP while iterative queries use UDP',
        isCorrect: false,
      },
      { key: 'C', text: 'Iterative queries can only resolve .com domains', isCorrect: false },
      { key: 'D', text: 'They describe identical behaviors', isCorrect: false },
    ],
    explanation:
      'Clients make recursive queries to their local resolver (e.g. 8.8.8.8). The resolver makes iterative queries to Root, TLD (.com), and Authoritative nameservers.',
    expectedTimeSeconds: 35,
    tags: ['networks', 'dns'],
  },
];
