document.addEventListener('DOMContentLoaded', function() {
    // Quiz creation form handling
    const quizForm = document.getElementById('quizForm');
    const addQuestionBtn = document.getElementById('addQuestion');
    const questionsContainer = document.getElementById('questionsContainer');
    const questionTemplate = document.getElementById('questionTemplate');
    
    if (addQuestionBtn && questionTemplate) {
        let questionCount = 0;
        
        // Add initial question
        addQuestion();
        
        // Add question button click handler
        addQuestionBtn.addEventListener('click', addQuestion);
        
        function addQuestion() {
            const questionNumber = ++questionCount;
            const questionNode = questionTemplate.content.cloneNode(true);
            
            // Update question number and indices
            questionNode.querySelector('.question-number').textContent = questionNumber;
            
            const inputs = questionNode.querySelectorAll('[name*="INDEX"]');
            inputs.forEach(input => {
                input.name = input.name.replace('INDEX', questionNumber - 1);
            });
            
            // Handle question type changes
            const questionTypeSelect = questionNode.querySelector('.question-type');
            const optionsContainer = questionNode.querySelector('.options-container');
            
            if (questionTypeSelect) {
                questionTypeSelect.addEventListener('change', function() {
                    updateQuestionType(this, optionsContainer);
                });
            }
            
            // Add option button handler
            const addOptionBtn = questionNode.querySelector('.add-option');
            if (addOptionBtn) {
                addOptionBtn.addEventListener('click', function() {
                    addOption(this.closest('.options-container'), questionNumber - 1);
                });
            }
            
            // Remove question button handler
            const removeBtn = questionNode.querySelector('.remove-question');
            if (removeBtn) {
                removeBtn.addEventListener('click', function() {
                    if (questionCount > 1) {
                        this.closest('.question-card').remove();
                        questionCount--;
                        updateQuestionNumbers();
                    } else {
                        alert('You need at least one question!');
                    }
                });
            }
            
            questionsContainer.appendChild(questionNode);
        }
        
        function updateQuestionType(select, optionsContainer) {
            const questionType = select.value;
            
            if (questionType === 'trueFalse') {
                const optionList = optionsContainer.querySelector('.option-list');
                optionList.innerHTML = `
                    <div class="input-group mb-2">
                        <span class="input-group-text">A</span>
                        <input type="text" class="form-control" value="True" readonly>
                    </div>
                    <div class="input-group mb-2">
                        <span class="input-group-text">B</span>
                        <input type="text" class="form-control" value="False" readonly>
                    </div>
                `;
                optionsContainer.querySelector('.add-option').style.display = 'none';
            } else if (questionType === 'shortAnswer') {
                optionsContainer.style.display = 'none';
            } else {
                optionsContainer.style.display = 'block';
                optionsContainer.querySelector('.add-option').style.display = 'inline-block';
            }
        }
        
        function addOption(optionsContainer, questionIndex) {
            const optionList = optionsContainer.querySelector('.option-list');
            const optionCount = optionList.children.length;
            
            if (optionCount >= 6) {
                alert('Maximum 6 options allowed.');
                return;
            }
            
            const letter = String.fromCharCode(65 + optionCount); // A, B, C, etc.
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'input-group mb-2';
            optionDiv.innerHTML = `
                <span class="input-group-text">${letter}</span>
                <input type="text" class="form-control" name="questions[${questionIndex}].options[${optionCount}]" required>
                <button type="button" class="btn btn-outline-danger remove-option">×</button>
            `;
            
            const removeBtn = optionDiv.querySelector('.remove-option');
            removeBtn.addEventListener('click', function() {
                optionDiv.remove();
                updateOptionLetters(optionList);
                updateOptionIndices(optionList, questionIndex);
            });
            
            optionList.appendChild(optionDiv);
        }
        
        function updateOptionLetters(optionList) {
            Array.from(optionList.children).forEach((option, idx) => {
                const letter = String.fromCharCode(65 + idx);
                option.querySelector('.input-group-text').textContent = letter;
            });
        }
        
        function updateOptionIndices(optionList, questionIndex) {
            Array.from(optionList.children).forEach((option, idx) => {
                const input = option.querySelector('input');
                input.name = `questions[${questionIndex}].options[${idx}]`;
            });
        }
        
        function updateQuestionNumbers() {
            const questions = document.querySelectorAll('.question-card');
            questions.forEach((question, idx) => {
                question.querySelector('.question-number').textContent = idx + 1;
                
                const inputs = question.querySelectorAll('[name^="questions["]');
                inputs.forEach(input => {
                    const name = input.name;
                    input.name = name.replace(/questions\[\d+\]/g, `questions[${idx}]`);
                });
            });
        }
    }
});
