const wizardData = [
    {
        id: 1,
        title: "Design & Architecture",
        desc: "Select a tool to design your system architecture before provisioning.",
        options: [
            { id: "diagram-net", name: "Diagram.net", icon: "✏️", desc: "Open-source architecture diagramming platform." },
            { id: "plantuml", name: "PlantUML", icon: "🌱", desc: "Diagram-as-code solution." },
            { id: "excalidraw", name: "Excalidraw", icon: "🎨", desc: "Collaborative whiteboarding." },
            { id: "skip", name: "Skip Design", icon: "⏭️", desc: "I already have a design." }
        ]
    },
    {
        id: 2,
        title: "Containerization",
        desc: "Choose the container runtime for your applications.",
        options: [
            { id: "docker", name: "Docker", icon: "🐳", desc: "Industry-standard container runtime." },
            { id: "podman", name: "Podman", icon: "🦭", desc: "Daemonless Docker alternative." },
            { id: "containerd", name: "Containerd", icon: "📦", desc: "CNCF container runtime." }
        ]
    },
    {
        id: 3,
        title: "Orchestration",
        desc: "Select the orchestration platform to manage your containers.",
        options: [
            { id: "k3s", name: "K3s", icon: "🚀", desc: "Lightweight Kubernetes distribution. Ideal for edge & dev." },
            { id: "kubernetes", name: "Kubernetes", icon: "☸️", desc: "Full industry-standard Kubernetes platform." },
            { id: "nomad", name: "Nomad", icon: "💠", desc: "HashiCorp workload orchestrator." }
        ]
    },
    {
        id: 4,
        title: "Ingress & API Gateway",
        desc: "How will traffic enter your cluster?",
        options: [
            { id: "traefik", name: "Traefik", icon: "🚦", desc: "Modern reverse proxy and ingress controller." },
            { id: "kong", name: "Kong", icon: "🦍", desc: "API Gateway and API Management platform." },
            { id: "nginx", name: "NGINX Ingress", icon: "🟢", desc: "Standard Kubernetes ingress solution." }
        ]
    },
    {
        id: 5,
        title: "CI/CD & GitOps",
        desc: "Select your automation and deployment pipeline tools.",
        options: [
            { id: "gitlab", name: "GitLab CI/CD", icon: "🦊", desc: "Integrated DevOps automation platform." },
            { id: "argocd", name: "ArgoCD", icon: "🐙", desc: "Declarative GitOps continuous delivery." },
            { id: "jenkins", name: "Jenkins", icon: "🤵", desc: "Open-source automation server." }
        ]
    },
    {
        id: 6,
        title: "Databases",
        desc: "What databases does your application need?",
        options: [
            { id: "postgresql", name: "PostgreSQL", icon: "🐘", desc: "Advanced relational database." },
            { id: "mysql", name: "MySQL", icon: "🐬", desc: "Popular relational database." },
            { id: "mongodb", name: "MongoDB", icon: "🍃", desc: "Document NoSQL database." },
            { id: "redis", name: "Redis", icon: "🔴", desc: "In-memory key-value store." }
        ]
    }
];

let currentStep = 1;
const totalSteps = 7;
const selections = {};

const container = document.getElementById('wizard-container');
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
const stepsList = document.querySelectorAll('.step');

function initWizard() {
    renderSteps();
    updateUI();
    
    btnNext.addEventListener('click', () => {
        if (currentStep === totalSteps) {
            provisionStack();
        } else {
            currentStep++;
            updateUI();
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
        }
    });
}

function renderSteps() {
    container.innerHTML = '';
    
    // Render Selection Steps
    wizardData.forEach(stepData => {
        const stepDiv = document.createElement('div');
        stepDiv.className = `step-content`;
        stepDiv.id = `step-${stepData.id}`;
        
        let optionsHtml = stepData.options.map(opt => `
            <div class="option-card" data-step="${stepData.id}" data-id="${opt.id}">
                <div class="card-icon">${opt.icon}</div>
                <h3 class="card-title">${opt.name}</h3>
                <p class="card-desc">${opt.desc}</p>
            </div>
        `).join('');

        stepDiv.innerHTML = `
            <div class="step-header">
                <h2>${stepData.title}</h2>
                <p>${stepData.desc}</p>
            </div>
            <div class="options-grid">
                ${optionsHtml}
            </div>
        `;
        
        container.appendChild(stepDiv);
    });

    // Render Review Step
    const reviewDiv = document.createElement('div');
    reviewDiv.className = `step-content`;
    reviewDiv.id = `step-7`;
    reviewDiv.innerHTML = `
        <div class="step-header">
            <h2>Review & Provision</h2>
            <p>Review your selected open-source stack. Once provisioned, OpenCloud will configure these tools for you.</p>
        </div>
        <div class="summary-container" id="summary-content">
            <!-- Populated dynamically -->
        </div>
        <div class="deploy-status" id="deploy-status">
            <h3>Provisioning Stack...</h3>
            <div class="logs" id="deploy-logs"></div>
        </div>
    `;
    container.appendChild(reviewDiv);

    // Attach click listeners to cards
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function() {
            const stepId = this.getAttribute('data-step');
            const optId = this.getAttribute('data-id');
            
            // Remove selected from siblings
            document.querySelectorAll(`.option-card[data-step="${stepId}"]`).forEach(c => c.classList.remove('selected'));
            
            // Select this
            this.classList.add('selected');
            selections[stepId] = optId;
            
            // Auto-advance
            setTimeout(() => {
                btnNext.click();
            }, 400);
        });
    });
}

function updateUI() {
    // Update step visibility
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${currentStep}`).classList.add('active');

    // Update Sidebar
    stepsList.forEach(el => {
        const stepNum = parseInt(el.getAttribute('data-step'));
        el.classList.remove('active', 'completed');
        if (stepNum === currentStep) el.classList.add('active');
        if (stepNum < currentStep) el.classList.add('completed');
    });

    // Update Buttons
    btnPrev.disabled = currentStep === 1;
    
    if (currentStep === totalSteps) {
        btnNext.textContent = "Provision Stack";
        populateSummary();
    } else {
        btnNext.textContent = "Continue";
    }
}

function populateSummary() {
    const summaryBox = document.getElementById('summary-content');
    let html = '';
    
    wizardData.forEach(step => {
        const selectedId = selections[step.id] || 'Not Selected';
        const opt = step.options.find(o => o.id === selectedId);
        const name = opt ? opt.name : 'Default/None';
        
        html += `
            <div class="summary-item">
                <span class="summary-label">${step.title}</span>
                <span class="summary-value">${name}</span>
            </div>
        `;
    });
    
    summaryBox.innerHTML = html;
}

function provisionStack() {
    btnNext.disabled = true;
    btnPrev.disabled = true;
    document.getElementById('deploy-status').classList.add('active');
    const logs = document.getElementById('deploy-logs');
    
    const addLog = (msg, type='info') => {
        const div = document.createElement('div');
        div.className = `log-line ${type}`;
        div.textContent = `> ${msg}`;
        logs.appendChild(div);
        logs.scrollTop = logs.scrollHeight;
    };

    addLog('Initializing OpenCloud Abstractor...', 'info');
    
    // Mock the provision delay since we are now sandboxing on demand later
    setTimeout(() => {
        addLog('Generating unified Infrastructure-as-Code definitions...', 'info');
        setTimeout(() => addLog('Bootstrapping environment based on selections...', 'info'), 1000);
        setTimeout(() => addLog('Applying selected tools on-demand...', 'info'), 2000);
        
        setTimeout(() => {
            addLog('Environment successfully provisioned!', 'success');
            btnNext.textContent = "Go to Sandbox IDE";
            btnNext.disabled = false;
            btnNext.onclick = showDashboard;
        }, 3500);
    }, 1000);
}

let editorInstance = null;

function showDashboard() {
    document.getElementById('wizard-container').style.display = 'none';
    document.getElementById('wizard-footer').style.display = 'none';
    document.querySelector('.sidebar').style.display = 'none';
    
    document.getElementById('topbar-title').textContent = "OpenCloud IDE & Sandbox";
    document.getElementById('topbar-desc').textContent = "Write code, configure tools, and run a temporary containerized environment.";
    
    document.getElementById('dashboard-container').style.display = 'flex';
    
    initTabs();
    initMonaco();
    populateConfigPanels();

    document.getElementById('btn-run-sandbox').addEventListener('click', runSandbox);
    document.getElementById('btn-teardown').addEventListener('click', teardownSandbox);
}

function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            
            e.target.classList.add('active');
            const targetId = e.target.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            
            if (targetId === 'tab-ide') {
                targetEl.style.display = 'flex';
                if(editorInstance) editorInstance.layout();
            } else {
                targetEl.style.display = 'block';
            }
        });
    });
}

function initMonaco() {
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});
    require(['vs/editor/editor.main'], function() {
        editorInstance = monaco.editor.create(document.getElementById('editor-container'), {
            value: [
                'package main',
                '',
                'import (',
                '\t"fmt"',
                '\t"net/http"',
                ')',
                '',
                'func main() {',
                '\thttp.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {',
                '\t\tfmt.Fprintf(w, "Hello from OpenCloud Sandbox!")',
                '\t})',
                '\tfmt.Println("Server running on port 8080...")',
                '\thttp.ListenAndServe(":8080", nil)',
                '}'
            ].join('\n'),
            language: 'go',
            theme: 'vs-dark',
            automaticLayout: true
        });
    });
}

function populateConfigPanels() {
    const panelsGrid = document.getElementById('config-panels');
    panelsGrid.innerHTML = '';
    
    wizardData.forEach(step => {
        const selectedId = selections[step.id];
        if (selectedId && selectedId !== 'skip') {
            const opt = step.options.find(o => o.id === selectedId);
            const card = document.createElement('div');
            card.className = 'option-card';
            card.style.cursor = 'default';
            card.style.transform = 'none';
            card.innerHTML = `
                <div class="card-title" style="display:flex; align-items:center; gap:0.5rem;">
                    ${opt.icon} ${opt.name}
                </div>
                <div class="config-form">
                    <div class="config-row">
                        <label>Version Tag</label>
                        <input type="text" value="latest" id="config-${opt.id}-version">
                    </div>
                    <div class="config-row">
                        <label>Expose Port</label>
                        <input type="number" placeholder="Default" id="config-${opt.id}-port">
                    </div>
                </div>
            `;
            panelsGrid.appendChild(card);
        }
    });
}

function runSandbox() {
    // Switch to deploy tab
    document.querySelector('.tab-btn[data-target="tab-deploy"]').click();
    
    const logs = document.getElementById('sandbox-logs');
    logs.innerHTML = '';
    
    const addLog = (msg, type='info') => {
        const div = document.createElement('div');
        div.className = `log-line ${type}`;
        div.textContent = `> ${msg}`;
        logs.appendChild(div);
        logs.scrollTop = logs.scrollHeight;
    };

    addLog('Packaging IDE code...', 'info');
    
    const code = editorInstance ? editorInstance.getValue() : '';
    
    fetch('/api/v1/sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code: code,
            selections: selections
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            addLog('Error: ' + data.error, 'error');
        } else {
            addLog('Docker Compose configuration generated.', 'info');
            addLog('Pulling required images for selected tools...', 'info');
            setTimeout(() => addLog('Starting temporary sandbox containers...', 'info'), 2000);
            setTimeout(() => addLog(data.message || 'Sandbox is now running! View at localhost:8080', 'success'), 4000);
        }
    })
    .catch(err => {
        addLog('Network Error: ' + err.message, 'error');
    });
}

function teardownSandbox() {
    const logs = document.getElementById('sandbox-logs');
    const div = document.createElement('div');
    div.className = `log-line info`;
    div.textContent = `> Stopping and removing sandbox containers...`;
    logs.appendChild(div);
    
    fetch('/api/v1/sandbox/teardown', { method: 'POST' })
    .then(() => {
        const d2 = document.createElement('div');
        d2.className = `log-line success`;
        d2.textContent = `> Sandbox successfully destroyed. Environment is clean.`;
        logs.appendChild(d2);
    });
}

// Start
document.addEventListener('DOMContentLoaded', initWizard);
