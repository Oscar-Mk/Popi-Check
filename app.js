const { createApp } = Vue;
const { jsPDF } = window.jspdf;

createApp({
    data() {
        return {
            activeTab: 'home',
            
            // --- ASSESSMENT DATA ---
            assessmentSubmitted: false,
            totalScore: 0,
            scoreColor: '',
            scoreMessage: '',
            sectionScores: { security: 0, offences: 0 },
            identifiedRisks: [],
            questions: {
                security: [
                    { text: "Do you suppress marketing to users who have opted out (Opt-Out Registry)?", answer: null, risk: "Violation of Chapter 8 (Direct Marketing) rights." },
                    { text: "Do you have proof of consent (Opt-In) for all new contacts?", answer: null, risk: "Section 69 Violation: Unsolicited electronic communication." },
                    { text: "Are unsubscribe links functioning and tested monthly?", answer: null, risk: "Failure to provide means to object (Section 69)." }
                ],
                offences: [
                    { text: "Is your Information Officer registered with the Regulator?", answer: null, risk: "Non-compliance with Officer duties (Section 55/56)." },
                    { text: "Do you have a procedure to prevent obstruction of a Regulator search?", answer: null, risk: "Risk of criminal offence (Section 102 - Obstruction)." },
                    { text: "Do you ensure no false evidence is given to the Regulator during audits?", answer: null, risk: "Risk of criminal offence (Section 104 - False Evidence)." }
                ]
            },

            // --- MARKETING SANITIZER DATA ---
            csvProcessed: false,
            complianceScore: 0,
            riskContacts: [],

            // --- AUDITOR DATA ---
            auditorQ1: null, // AI Auto Reject?
            auditorQ2: null  // Human Review?
        }
    },
    computed: {
        // Logic for Decision Auditor (Chapter 8, Section 71)
        auditorResult() {
            if (this.auditorQ1 === 'yes') {
                if (this.auditorQ2 === 'no') return 'violation'; // Automated decision without human view
                if (this.auditorQ2 === 'yes') return 'compliant';
            }
            if (this.auditorQ1 === 'no') return 'compliant';
            return null;
        }
    },
    methods: {
        // Helper to style sidebar buttons
        navClass(tabName) {
            const baseClasses = "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 group text-left";
            if (this.activeTab === tabName) {
                return `${baseClasses} bg-blue-600 text-white shadow-lg shadow-blue-900/20`;
            }
            return `${baseClasses} hover:bg-slate-800 text-slate-300 hover:text-white`;
        },

        // --- ASSESSMENT LOGIC ---
        submitAssessment() {
            let scoreSec = 0;
            let scoreOff = 0;
            this.identifiedRisks = [];

            // Calculate Security (Ch 8)
            this.questions.security.forEach(q => {
                if (q.answer === true) scoreSec += 2; // 2 points per correct answer
                else if (q.answer === false) this.identifiedRisks.push(q.risk);
            });

            // Calculate Offences (Ch 11)
            this.questions.offences.forEach(q => {
                if (q.answer === true) scoreOff += 2;
                else if (q.answer === false) this.identifiedRisks.push(q.risk);
            });

            // Total Calculations (Max score 12)
            const total = scoreSec + scoreOff;
            this.sectionScores = { security: scoreSec, offences: scoreOff };
            this.totalScore = Math.round((total / 12) * 100);
            
            // Set UI Colors based on score
            if (this.totalScore >= 80) {
                this.scoreColor = 'text-green-600';
                this.scoreMessage = "High Compliance Level";
            } else if (this.totalScore >= 50) {
                this.scoreColor = 'text-yellow-600';
                this.scoreMessage = "Moderate Risk Detected";
            } else {
                this.scoreColor = 'text-red-600';
                this.scoreMessage = "Critical Non-Compliance";
            }

            this.assessmentSubmitted = true;
        },

        generatePDF() {
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(20);
            doc.setTextColor(40, 40, 40);
            doc.text("POPI Checkup Lite - Assessment Report", 20, 20);
            
            doc.setFontSize(12);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
            doc.text(`Overall Score: ${this.totalScore}%`, 20, 40);

            // Scores
            doc.setDrawColor(200, 200, 200);
            doc.line(20, 45, 190, 45);
            
            doc.text("Chapter 8 (Security & Marketing): " + this.sectionScores.security + "/6", 20, 55);
            doc.text("Chapter 11 (Offences): " + this.sectionScores.offences + "/6", 20, 65);

            // Risks
            doc.setFontSize(14);
            doc.setTextColor(220, 53, 69); // Red
            doc.text("Identified Risks:", 20, 85);
            
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            
            let yPos = 95;
            if (this.identifiedRisks.length === 0) {
                doc.setTextColor(40, 167, 69); // Green
                doc.text("No critical risks identified.", 20, yPos);
            } else {
                this.identifiedRisks.forEach(risk => {
                    doc.text("• " + risk, 20, yPos);
                    yPos += 10;
                });
            }

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text("Generated by POPI Checkup Lite", 20, 280);

            doc.save("POPIA-Assessment-Report.pdf");
        },

        // --- MARKETING SANITIZER LOGIC ---
        handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    this.processCSV(results.data);
                }
            });
        },

        processCSV(data) {
            let compliantCount = 0;
            this.riskContacts = [];

            data.forEach(row => {
                // Mock Logic: Check for a 'Consent' column being 'true' or 'yes'
                // If column doesn't exist, randomly flag for demo purposes if strictly needed, 
                // but let's try to be smart first.
                
                const consent = row['Consent'] || row['consent'] || row['OptIn'];
                const hasConsent = consent && (consent.toLowerCase() === 'yes' || consent.toLowerCase() === 'true' || consent === '1');
                
                if (hasConsent) {
                    compliantCount++;
                } else {
                    this.riskContacts.push({
                        Name: row['Name'] || row['name'] || 'Unknown',
                        Email: row['Email'] || row['email'] || 'No Email'
                    });
                }
            });

            // If no rows found or empty file
            if (data.length === 0) {
                this.complianceScore = 0;
            } else {
                this.complianceScore = Math.round((compliantCount / data.length) * 100);
            }
            
            this.csvProcessed = true;
        }
    }
}).mount('#app');