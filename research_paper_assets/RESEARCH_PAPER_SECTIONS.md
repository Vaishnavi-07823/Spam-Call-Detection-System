# VoxShield AI: Research Paper Methodology, Architecture & Figures

**Author:** Vaishnavi Trivedi  
**Department:** Computer Science and Engineering (Cybersecurity)  
**Institution:** G.H. Raisoni College of Engineering (GHRCE), Nagpur  
**Project:** VoxShield AI — Real-Time Conversational Fraud and Scam Detection Engine

---

## 1. Research Paper Figures Summary

All figures in this package are **100% original, plagiarism-free vector diagrams** designed specifically according to the implementation in `src/services/detection.functions.ts`, `src/services/riskAnalyzer.ts`, `src/services/geminiService.server.ts`, and `src/hooks/useSpeechRecognition.ts`.

| Figure # | File Name | Format | Purpose & Research Contribution |
| :--- | :--- | :--- | :--- |
| **Figure 1** | `figure1_system_architecture.svg` | Scalable Vector (SVG) & High-Res PNG | Comprehensive 4-tier system architecture: Audio Ingestion, Dual-Engine Hybrid Pipeline, Arbitration Core, and Telemetry HUD. |
| **Figure 2** | `figure2_detection_workflow.svg` | Scalable Vector (SVG) & High-Res PNG | Real-time state transition workflow, timeout circuit breaker ($\tau = 6000\text{ ms}$), and tri-state threshold routing ($S < 40$, $40 \le S \le 70$, $S > 70$). |
| **Figure 3** | `figure3_hybrid_scoring_pipeline.svg` | Scalable Vector (SVG) & High-Res PNG | Mathematical formulation of lexical weight accumulation, LLM schema inference, max-pooling fusion $S_{\text{final}} = \max(S_{\text{rule}}, S_{\text{AI}})$, and zone spectrum. |
| **Figure 4** | `figure4_scam_threat_taxonomy.svg` | Scalable Vector (SVG) & High-Res PNG | 8-class hierarchical ontology of phone scams: Credential Theft, Tech Support, Police/CBI Impersonation, Financial/KYC, Urgency, etc. |
| **Figure 5** | `graphical_abstract.jpg` | High-Resolution Image | Conceptual graphical abstract for journal submission, conference banner, or poster presentation. |

> **Interactive Figure Exporter:** Open `export_figures.html` in any browser to preview all diagrams and download them as **300 DPI publication-ready PNGs or SVGs** with a single click.

---

## 2. Proposed System Architecture (For Section III of Paper)

### A. Architectural Overview
Traditional telecommunication anti-fraud mechanisms rely predominantly on static caller-ID blacklists or post-call forensic audits. However, modern social engineering attacks exploit VoIP spoofing, ephemeral SIM cards, and fast-paced coercive tactics (such as immediate UPI transfers or digital arrest pretexts) that compromise victims before post-incident audits can intervene.

To mitigate this critical vulnerability, **VoxShield AI** implements a zero-trust, continuous, in-call conversational monitoring pipeline that analyzes ongoing acoustic speech streams in real time. The architecture comprises four integrated layers:

1. **Acoustic Ingestion & Streaming ASR Tier:** Captures ambient or speakerphone audio directly from the client terminal using the Web Audio and Web Speech APIs (`webkitSpeechRecognition`). The engine operates in continuous mode (`continuous: true`, `interimResults: true`) targeting localized acoustic models (`en-IN` and `hi-IN`). Audio frames are transcribed into tokenized streaming text segments.
2. **Temporal Segmentation & Sliding Window:** To eliminate processing lag, transcription tokens are fed into an adaptive sliding window buffer. Once a segment reaches the minimal threshold ($\ge 3$ characters), the input is sanitized and validated against a strict schema (limiting payloads between 3 and 5,000 characters) before asynchronous parallel dispatch.
3. **Dual-Engine Hybrid Threat Analyzer:** Instead of relying exclusively on cloud LLMs (which introduce latency and network failure risks) or simple keyword filters (which lack semantic context), the core analyzer operates two asynchronous branches in parallel:
   - **Deterministic Lexical Heuristic Engine (Branch A):** An ultra-fast ($\le 5\text{ ms}$) local matcher evaluating a weighted lexicon of 95+ critical fraud triggers across English and Hinglish vernacular (e.g., *"OTP"*, *"CVV"*, *"AnyDesk"*, *"CBI"*, *"Khata Block"*, *"Girftari"*).
   - **Cognitive LLM Semantic Reasoner (Branch B):** A deep generative model (Google Gemini 1.5 Flash via Lovable AI Gateway) invoked using strict JSON schema tool calling (`analyze_transcript`). It evaluates psychological manipulation, authority impersonation, false urgency, and multi-turn deception vectors.
4. **Threat Arbitration Core & Fallback Circuit Breaker:** Coordinates parallel outputs. A hardware watchdog enforces a strict timeout $\tau = 6000\text{ ms}$. If the LLM network request stalls or fails, the circuit breaker defaults to the deterministic rule score, ensuring zero monitoring downtime. The final composite score is derived via a max-pooling fusion operator:
   $$S_{\text{final}} = \max(S_{\text{rule}}, S_{\text{AI}})$$
5. **Non-Blocking Telemetry HUD & Persistence:** The client-side interface displays a live dynamic radial risk gauge and actionable defensive advisories without disrupting ongoing call audio. Session telemetry is asynchronously committed to a Supabase PostgreSQL database for threat auditing and post-call forensics.

---

## 3. Mathematical Formulation of the Hybrid Scoring Pipeline

Let an incoming streaming speech segment at time $t$ be represented as transcript $T = \{t_1, t_2, \dots, t_n\}$.

### 1. Lexical Pattern Matching Formulation
Let $\mathcal{D} = \{(k_i, w_i, c_i)\}_{i=1}^{M}$ represent the weighted fraud lexicon, where each entry comprises keyword $k_i$, weight $w_i \in [25, 85]$, and semantic category $c_i \in \mathcal{C}$.

The set of active detected keywords in transcript $T$ is given by:
$$\mathcal{M}(T) = \{ (k_i, w_i, c_i) \in \mathcal{D} \mid k_i \subseteq \text{lowercase}(T) \}$$

The deterministic heuristic risk score $S_{\text{rule}}(T) \in [0, 100]$ is computed as:
$$S_{\text{rule}}(T) = \min\left(100, \sum_{(k_i, w_i, c_i) \in \mathcal{M}(T)} w_i\right)$$

The heuristic category $C_{\text{rule}}(T)$ is selected via majority weight voting:
$$C_{\text{rule}}(T) = \arg\max_{c \in \mathcal{C}} \sum_{\substack{(k_i, w_i, c_i) \in \mathcal{M}(T) \\ c_i = c}} w_i$$

### 2. Cognitive LLM Semantic Reasoning Formulation
Let $\mathcal{P}(T)$ denote the structured system prompt instructing the model to evaluate seven adversarial dimensions: personal credential solicitation, synthetic urgency, authority impersonation, lottery lures, irregular payment requests, remote access tools, and legal threats.

The LLM inference produces a structured four-element tuple:
$$\langle S_{\text{AI}}, C_{\text{AI}}, R_{\text{AI}}, G_{\text{AI}} \rangle = \mathcal{M}_{\text{LLM}}(\mathcal{P}(T), \Theta)$$
where $S_{\text{AI}} \in [0, 100]$ is the semantic risk score, $C_{\text{AI}} \in \mathcal{C}$ is the identified fraud category, $R_{\text{AI}}$ is the human-readable forensic justification, and $G_{\text{AI}}$ is the defensive suggestion.

### 3. Fault-Tolerant Circuit Breaker & Fallback
To ensure bounded latency ($\Delta t \le \tau$, where $\tau = 6000\text{ ms}$):
$$S_{\text{AI}}^* = \begin{cases} S_{\text{AI}}, & \text{if } \Delta t \le \tau \text{ and } \text{Status} = \text{SUCCESS} \\ S_{\text{rule}}, & \text{if } \Delta t > \tau \text{ or } \text{Status} = \text{ERROR} \end{cases}$$

### 4. Maximum-Pooling Threat Fusion Operator
To eliminate false negatives on unambiguous high-risk cues (such as asking for an OTP or screen-share APK), the arbitration core computes the final threat metric $S_{\text{final}}$:
$$S_{\text{final}} = \max\left(S_{\text{rule}}, S_{\text{AI}}^*\right)$$

Category reconciliation is resolved by assigning primacy to the higher-scoring engine:
$$C_{\text{final}} = \begin{cases} C_{\text{rule}}, & \text{if } S_{\text{rule}} \ge S_{\text{AI}}^* \\ C_{\text{AI}}, & \text{if } S_{\text{AI}}^* > S_{\text{rule}} \end{cases}$$

### 5. Tri-Tier Threat Mapping
The dynamic mitigation state is determined by:
$$\text{HUD\_State}(S_{\text{final}}) = \begin{cases} 
\text{SAFE (Passive Monitor)}, & 0 \le S_{\text{final}} < 40 \\
\text{SUSPICIOUS (Warning Banner)}, & 40 \le S_{\text{final}} \le 70 \\
\text{CRITICAL SCAM (Immediate Disconnect)}, & 70 < S_{\text{final}} \le 100
\end{cases}$$

---

## 4. Formal Algorithm in Pseudocode (For Research Paper)

```latex
\begin{algorithm}[H]
\caption{Real-Time Dual-Engine Scam Call Detection Algorithm}
\label{alg:voxshield_detection}
\begin{algorithmic}[1]
\REQUIRE Streaming Audio Stream $\mathcal{A}$, Lexicon $\mathcal{D}$, Timeout Threshold $\tau = 6000\text{ms}$
\ENSURE Real-time Risk Score $S_{\text{final}}$, Category $C_{\text{final}}$, Mitigation Action $\mathcal{U}$
\STATE Initialize ASR Engine $\mathcal{R}_{\text{ASR}} \leftarrow \text{WebSpeech}(\text{lang} = \text{en-IN} \mid \text{hi-IN})$
\STATE Initialize Sliding Window Buffer $\mathcal{B} \leftarrow \emptyset$
\WHILE{Call Status is ACTIVE}
    \STATE $audio\_frame \leftarrow \text{CaptureMicStream}(\mathcal{A})$
    \STATE $tokens \leftarrow \mathcal{R}_{\text{ASR}}.\text{transcribe}(audio\_frame)$
    \STATE $\mathcal{B} \leftarrow \mathcal{B} \cup tokens$
    \IF{$|\mathcal{B}| \ge 3 \text{ characters}$}
        \STATE $T \leftarrow \text{Sanitize}(\mathcal{B})$
        
        \STATE \textbf{// Branch A: Deterministic Rule Execution (Parallel)}
        \STATE $\mathcal{M}(T) \leftarrow \{ (k, w, c) \in \mathcal{D} \mid k \subseteq \text{lowercase}(T) \}$
        \STATE $S_{\text{rule}} \leftarrow \min(100, \sum w_i)$
        \STATE $C_{\text{rule}} \leftarrow \arg\max_{c} \sum_{c_i = c} w_i$
        
        \STATE \textbf{// Branch B: LLM Semantic Reasoning (With Watchdog)}
        \STATE $t_{\text{start}} \leftarrow \text{CurrentTime}()$
        \TRY
            \STATE $\langle S_{\text{AI}}, C_{\text{AI}}, R_{\text{AI}}, G_{\text{AI}} \rangle \leftarrow \text{Gemini\_Flash}(T, \text{timeout} = \tau)$
        \CATCH{TimeoutException | NetworkException}
            \STATE $S_{\text{AI}} \leftarrow S_{\text{rule}}$
            \STATE $C_{\text{AI}} \leftarrow C_{\text{rule}}$
            \STATE $R_{\text{AI}} \leftarrow \text{"AI timeout; defaulted to heuristic rule matching."}$
        \ENDTRY
        
        \STATE \textbf{// Threat Fusion \& Arbitration}
        \STATE $S_{\text{final}} \leftarrow \max(S_{\text{rule}}, S_{\text{AI}})$
        \STATE $C_{\text{final}} \leftarrow (S_{\text{rule}} \ge S_{\text{AI}}) \ ? \ C_{\text{rule}} : C_{\text{AI}}$
        
        \STATE \textbf{// Dynamic HUD Telemetry Update}
        \IF{$S_{\text{final}} > 70$}
            \STATE $\mathcal{U} \leftarrow \text{TriggerRedAlert}(\text{"High Risk Scam: Terminate Call Now!"})$
        \ELSIF{$S_{\text{final}} \ge 40$}
            \STATE $\mathcal{U} \leftarrow \text{TriggerWarning}(\text{"Suspicious Call: Verify Identity."})$
        \ELSE
            \STATE $\mathcal{U} \leftarrow \text{DisplaySafe}(\text{"Call Safe: Routine Dialogue."})$
        \ENDIF
        
        \STATE \textbf{AsyncCommit}(\text{SupabaseDB}, $T, S_{\text{final}}, C_{\text{final}}, \mathcal{U}, \text{timestamp}$)
    \ENDIF
\ENDWHILE
\STATE \textbf{return} PostCallSummary($\max_t S_{\text{final}}^{(t)}$)
\end{algorithmic}
\end{algorithm}
```

---

## 5. Ready-to-Copy LaTeX Figure Blocks for Overleaf / TeX

### Figure 1 (Architecture)
```latex
\begin{figure*}[!t]
\centering
\includegraphics[width=\textwidth]{figures/figure1_system_architecture.png}
\caption{End-to-End System Architecture of VoxShield AI: Comprising streaming acoustic ingestion via Web Speech API, parallel dual-engine lexical and cognitive LLM reasoning, maximum-pooling arbitration core, and live HUD telemetry.}
\label{fig:voxshield_architecture}
\end{figure*}
```

### Figure 2 (Workflow Flowchart)
```latex
\begin{figure}[!h]
\centering
\includegraphics[width=\columnwidth]{figures/figure2_detection_workflow.png}
\caption{Real-Time Processing Workflow and State Transition Diagram: Illustrating the continuous acoustic capture loop, asynchronous parallel analysis, 6000ms circuit-breaker fallback, and tri-tier risk threshold evaluation.}
\label{fig:voxshield_workflow}
\end{figure}
```

### Figure 3 (Scoring Pipeline & Math)
```latex
\begin{figure*}[!t]
\centering
\includegraphics[width=\textwidth]{figures/figure3_hybrid_scoring_pipeline.png}
\caption{Hybrid Threat Fusion Pipeline and Mathematical Scoring Model: Formulating lexical weight accumulation $S_{\text{rule}}$, LLM semantic inference $S_{\text{AI}}$, timeout circuit breaker, and the Max-Pooling fusion operator $S_{\text{final}} = \max(S_{\text{rule}}, S_{\text{AI}})$.}
\label{fig:voxshield_scoring}
\end{figure*}
```

### Figure 4 (Taxonomy)
```latex
\begin{figure*}[!t]
\centering
\includegraphics[width=\textwidth]{figures/figure4_scam_threat_taxonomy.png}
\caption{Taxonomy of Phone Fraud Threat Vectors: Eight-tier ontology modeling credential theft, remote access tools, authority impersonation, utility fraud, and regional Hinglish coercion tactics.}
\label{fig:voxshield_taxonomy}
\end{figure*}
```
