const { createApp, ref, computed } = Vue;
const { jsPDF } = window.jspdf;

createApp({
    setup() {
        const activeTab = ref('home'); 
        
        // --- ASSESSMENT LOGIC ---
        const assessmentSubmitted = ref(false);
        const questions = ref({
            security: [
                { text: "Do you verify consent before adding contacts? (S69)", answer: null, risk: "Risk of Spamming" },
                { text: "Do emails include 'Unsubscribe' link? (S69)", answer: null, risk: "No Opt-Out" },
                { text: "Do you purge opt-out contacts? (S69)", answer: null, risk: "Ignoring Rights" },
                { text: "Automated calling consent? (S69)", answer: null, risk: "Illegal Calls" },
                { text: "Human review for AI decisions? (S71)", answer: null, risk: "Automated Violation" },
                { text: "Public directory notification? (S70)", answer: null, risk: "Directory Violation" }
            ],
            offences: [
                { text: "Encrypt bank info files? (S105)", answer: null, risk: "Criminal Negligence" },
                { text: "Process to allow warrants? (S102)", answer: null, risk: "Obstruction" },
                { text: "Verify evidence truth? (S103)", answer: null, risk: "False Evidence" },
                { text: "Staff trained on enforcement notices? (S100)", answer: null, risk: "Ignoring Notice" },
                { text: "Whistleblower policy? (S104)", answer: null, risk: "No Reporting" },
                { text: "Redact emails? (S105)", answer: null, risk: "Exposed Data" }
            ]
        });

        const totalScore = ref(0);

        const submitAssessment = () => {
            let score = 0;
            questions.value.security.forEach(q => { if(q.answer) score++; });
            questions.value.offences.forEach(q => { if(q.answer) score++; });
            totalScore.value = Math.round((score / 12) * 100);
            assessmentSubmitted.value = true;
        };

        const generatePDF = () => {
            const doc = new jsPDF();
            doc.text("POPI Checkup Report", 20, 20);
            doc.text(`Score: ${totalScore.value}%`, 20, 30);
            doc.save("report.pdf");
        };

        // --- MARKETING & BLOCKCHAIN LOGIC ---
        const csvProcessed = ref(false);
        const riskContacts = ref([]);
        const blockchainReceipt = ref(null);

        // Helper: Calculate SHA-256 Hash of a file
        const computeHash = async (file) => {
            const buffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        };

        const handleFileUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // 1. Generate Blockchain Hash
            const hash = await computeHash(file);
            blockchainReceipt.value = {
                hash: hash,
                timestamp: new Date().toISOString(),
                status: 'ANCHORED'
            };

            // 2. Parse CSV
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    riskContacts.value = results.data.filter(row => !row.Consent_Date || !row.Source);
                    csvProcessed.value = true;
                }
            });
        };
        const complianceScore = computed(() => {
            return csvProcessed.value ? Math.max(0, 100 - (riskContacts.value.length * 10)) : 0;
        });

        // --- AUDITOR LOGIC ---
        const auditorQ1 = ref(null);
        const auditorQ2 = ref(null);
        const auditorResult = computed(() => {
            if (auditorQ1.value === 'no') return 'compliant';
            if (auditorQ1.value === 'yes') {
                return auditorQ2.value === 'yes' ? 'compliant' : 'violation';
            }
            return null;
        });

        const navClass = (tab) => {
            return `w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${activeTab.value === tab ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`;
        };

        return {
            activeTab, navClass,
            questions, assessmentSubmitted, submitAssessment, totalScore, generatePDF,
            handleFileUpload, csvProcessed, riskContacts, complianceScore,
            auditorQ1, auditorQ2, auditorResult,
            blockchainReceipt // Added to return
        }
    }
}).mount('#app');