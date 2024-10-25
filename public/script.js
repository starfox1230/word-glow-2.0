let text, sentences, currentSentenceIndex, currentWordIndex;
let isStoryInserted = false;
let imageUrl = null; // To store the generated image URL
let totalWords = 0;  // To store the total number of words

document.getElementById('insertStoryButton').addEventListener('click', async function() {
    text = document.getElementById('storyArea').value;

    if (!text.trim()) {
        alert('Please enter a story.');
        return;
    }

    // Show a loading indicator (optional)
    document.getElementById('insertStoryButton').innerText = 'Generating Image...';
    document.getElementById('insertStoryButton').disabled = true;

    // Send the story to the backend to generate the image
    try {
        const response = await fetch('/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ story: text })
        });
        const data = await response.json();
        if (response.ok && data.imageUrl) {
            imageUrl = data.imageUrl;
            console.log('Image URL received:', imageUrl);
        } else {
            alert(data.error || 'Failed to generate image.');
            // Reset the button
            document.getElementById('insertStoryButton').innerText = 'Insert Story';
            document.getElementById('insertStoryButton').disabled = false;
            return;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while generating the image.');
        // Reset the button
        document.getElementById('insertStoryButton').innerText = 'Insert Story';
        document.getElementById('insertStoryButton').disabled = false;
        return;
    }

    // Hide the loading indicator
    document.getElementById('insertStoryButton').style.display = 'none';
    document.getElementById('storyArea').style.display = 'none';

    // Split the text into sentences and words
    const rawSentences = text.match(/[^.!?]+[.!?]+(?:["'”’]+)?(\s+|$)/g) || [text];
    sentences = rawSentences.map(sentence => {
        return sentence.trim().split(/(\b\w+['’]?\w*\b|\s+|\S)/).filter(Boolean).map(token => {
            return { content: token, isWord: /\w/.test(token) };
        });
    });
    currentSentenceIndex = 0;
    currentWordIndex = 0;
    isStoryInserted = true;

    // Calculate total number of words
    totalWords = 0;
    sentences.forEach(sentence => {
        sentence.forEach(token => {
            if (token.isWord) {
                totalWords += 1;
            }
        });
    });

    document.getElementById('buttons').style.display = 'block';
    document.getElementById('sentenceDisplay').style.display = 'block';

    updateSentence();  // Highlight the first word

    // Ensure the window captures key events
    window.focus();
});

function updateSentence() {
    const sentenceDisplay = document.getElementById('sentenceDisplay');
    sentenceDisplay.innerHTML = '';
    sentences[currentSentenceIndex].forEach((token, index) => {
        if (token.isWord && index === currentWordIndex) {
            sentenceDisplay.innerHTML += `<span class="highlight">${token.content}</span>`;
        } else {
            sentenceDisplay.innerHTML += token.content;
        }
    });

    // Calculate current word's global index
    let wordsBefore = 0;
    // Sum words in previous sentences
    for (let i = 0; i < currentSentenceIndex; i++) {
        sentences[i].forEach(token => {
            if (token.isWord) {
                wordsBefore += 1;
            }
        });
    }
    // Sum words in the current sentence up to the current word
    for (let i = 0; i < currentWordIndex; i++) {
        if (sentences[currentSentenceIndex][i].isWord) {
            wordsBefore += 1;
        }
    }
    // Current word index (1-based)
    let currentWordGlobalIndex = wordsBefore + 1;

    // Calculate progress percentage
    let progressPercent = (currentWordGlobalIndex / totalWords) * 100;

    // Update the progress bar width
    document.getElementById('progressBar').style.width = progressPercent + '%';

    // Optionally, update progress text if you added it
    document.getElementById('progressText').innerText = Math.floor(progressPercent) + '% completed';

    // Check if we've reached the end
    if (
        currentSentenceIndex >= sentences.length - 1 &&
        currentWordIndex >= sentences[currentSentenceIndex].length - 1
    ) {
        console.log('End of story reached. Showing "Show Image" button.');
        document.getElementById('showImageButton').style.display = 'block';
    }
}

function prevWord() {
    if (!isStoryInserted) return;
    do {
        if (currentWordIndex > 0) {
            currentWordIndex -= 1;
        } else if (currentSentenceIndex > 0) {
            currentSentenceIndex -= 1;
            currentWordIndex = sentences[currentSentenceIndex].length - 1;
        } else {
            return;
        }
    } while (!sentences[currentSentenceIndex][currentWordIndex].isWord);
    updateSentence();
}

function nextWord() {
    if (!isStoryInserted) return;
    do {
        if (currentWordIndex < sentences[currentSentenceIndex].length - 1) {
            currentWordIndex += 1;
        } else if (currentSentenceIndex < sentences.length - 1) {
            currentSentenceIndex += 1;
            currentWordIndex = 0;
        } else {
            // Reached the end of the story
            updateSentence(); // Ensure the last word is displayed
            return;
        }
    } while (!sentences[currentSentenceIndex][currentWordIndex].isWord);
    updateSentence();
}

document.getElementById('prevWordButton').addEventListener('click', prevWord);
document.getElementById('nextWordButton').addEventListener('click', nextWord);

// Update the keydown event listener
window.addEventListener('keydown', function(e) {
    if (isStoryInserted) {
        // Only handle these keys after the story has been submitted
        if (e.key === "ArrowRight") {
            nextWord();
        } else if (e.key === "ArrowLeft") {
            prevWord();
        } else if (e.key === "F1") {
            e.preventDefault(); // Prevent default F1 action (help menu)
            triggerWrongAnswerEffect();
        } else if (e.key === " ") {
            e.preventDefault(); // Prevent default spacebar scrolling
            triggerCorrectAnswerEffect();
        }
    }
    // If story is not inserted, allow default behavior
});

function triggerWrongAnswerEffect() {
    var highlightedWord = document.querySelector('.highlight'); // Get the currently highlighted word
    if (!highlightedWord) return; // If no word is highlighted, do nothing
    highlightedWord.classList.add('wrong-answer'); // Add 'wrong-answer' class to the highlighted word

    // After 1 second, remove the 'wrong-answer' class, reverting the color back to normal
    setTimeout(function() {
        highlightedWord.classList.remove('wrong-answer');
    }, 1000); // The animation lasts for 1 second
}

function triggerCorrectAnswerEffect() {
    var highlightedWord = document.querySelector('.highlight'); // Get the currently highlighted word
    if (!highlightedWord) return; // If no word is highlighted, do nothing
    highlightedWord.classList.add('correct-answer'); // Add 'correct-answer' class to the highlighted word

    // After 0.5 seconds, remove the 'correct-answer' class and move to the next word
    setTimeout(function() {
        highlightedWord.classList.remove('correct-answer');
        nextWord(); // Automatically moves to the next word after the animation completes
    }, 500); // The delay is set to 0.5 seconds
}

// Existing code for 'showImageButton' click event...
document.getElementById('showImageButton').addEventListener('click', function () {
    if (imageUrl) {
        document.getElementById('imageContainer').style.display = 'block';
        document.getElementById('generatedImage').src = imageUrl;
        // Hide the button after showing the image
        document.getElementById('showImageButton').style.display = 'none';
    } else {
        alert('Image not available.');
    }
});

// Prevent double-tap zoom on iOS devices
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    var now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
