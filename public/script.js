let text, sentences, currentSentenceIndex, currentWordIndex;
let isStoryInserted = false;
let imageUrl = null; // To store the generated image URL

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

    // Split the text into sentences
    const rawSentences = text.match(/[^.!?]+[.!?]+(?:["'”’]+)?(\s+|$)/g) || [text];
    sentences = rawSentences.map(sentence => {
        return sentence.trim().split(/(\b\w+['’]?\w*\b|\s+|\S)/).filter(Boolean).map(token => {
            return { content: token, isWord: /\w/.test(token) };
        });
    });
    currentSentenceIndex = 0;
    currentWordIndex = 0;
    isStoryInserted = true;

    document.getElementById('buttons').style.display = 'block';
    document.getElementById('sentenceDisplay').style.display = 'block';

    updateSentence();  // Highlight the first word
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
