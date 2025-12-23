let characters = [];
let currentBook = null;

console.log('script.js loaded');

// Helper function to extract image name from characterId or URL
function extractImageName(characterId, jsonUrl) {
    if (characterId) {
        // Try to extract image name from characterId
        // e.g., "veckurius_cezar" -> "veckurius"
        const parts = characterId.split('_');
        return parts[0];
    } else {
        // Fallback: extract from URL filename
        const urlParts = jsonUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const match = filename.match(/character_(\w+)/);
        if (match) {
            return match[1];
        }
    }
    return '';
}

// Fetch data.json and load all characters
async function loadCharacters() {
    console.log('loadCharacters() called');
    try {
        console.log('Fetching data.json...');
        const response = await fetch('https://svukelic.github.io/ve-cs/data.json');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded data.json, characters count:', data.characters?.length);
        
        if (!data.characters || !Array.isArray(data.characters)) {
            throw new Error('Invalid data.json format: characters array not found');
        }
        
        // Fetch all character JSONs in parallel
        const characterPromises = data.characters.map(async (jsonUrl) => {
            try {
                console.log('Fetching:', jsonUrl);
                const charResponse = await fetch(jsonUrl);
                if (!charResponse.ok) {
                    throw new Error(`HTTP error! status: ${charResponse.status}`);
                }
                
                const charData = await charResponse.json();
                console.log('Loaded character:', charData.basicInfo?.fullName || charData.characterId);
                
                // Handle supporting cast file (contains array of characters)
                if (charData.supportingCast && Array.isArray(charData.supportingCast)) {
                    return charData.supportingCast.map(char => {
                        return {
                            id: char.characterId || '',
                            name: char.basicInfo?.fullName || 'Unknown',
                            alias: char.basicInfo?.aliases?.[0] || '',
                            rank: char.basicInfo?.rank || char.basicInfo?.title || '',
                            association: char.basicInfo?.association || '',
                            image: char.basicInfo?.image || '',
                            jsonUrl: jsonUrl,
                            characterData: char
                        };
                    });
                }
                
                // Handle single character file
                return {
                    id: charData.characterId || '',
                    name: charData.basicInfo?.fullName || 'Unknown',
                    alias: charData.basicInfo?.aliases?.[0] || '',
                    rank: charData.basicInfo?.rank || '',
                    association: charData.basicInfo?.association || '',
                    image: charData.basicInfo?.image || '',
                    jsonUrl: jsonUrl,
                    characterData: charData
                };
            } catch (error) {
                console.error(`Error loading character from ${jsonUrl}:`, error);
                return null;
            }
        });
        
        const loadedCharacters = await Promise.all(characterPromises);
        console.log('All characters fetched, processing...');
        
        characters = loadedCharacters
            .filter(char => char !== null)
            .flat()
            .filter(char => char !== null);
        
        console.log('Total characters after processing:', characters.length);
        
        // Initialize grid with loaded characters
        initializeGrid();
    } catch (error) {
        console.error('Error loading data.json:', error);
        alert('Failed to load character data: ' + error.message);
    }
}

// Initialize character grid
function initializeGrid() {
    const grid = document.getElementById('characterGrid');
    
    if (!grid) {
        console.error('Character grid element not found!');
        return;
    }
    
    grid.innerHTML = ''; // Clear existing content
    
    if (characters.length === 0) {
        return;
    }
    
    characters.forEach(char => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.onclick = () => openCharacterBook(char);
        
        card.innerHTML = `
            <img src="${char.image}" alt="${char.name}" onerror="this.src='https://via.placeholder.com/300x400/2d2d2d/d4af37?text=${encodeURIComponent(char.name)}'">
            <div class="character-card-info">
                <h3>${char.name}</h3>
                ${char.alias ? `<p class="rank">"${char.alias}"</p>` : ''}
                ${char.rank ? `<p class="rank">${char.rank}</p>` : ''}
                ${char.association ? `<p>${char.association}</p>` : ''}
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Open book modal and load character data
async function openCharacterBook(char) {
    try {
        if (!char) {
            throw new Error('Character object is undefined');
        }
        
        console.log('Opening character book for:', char.name, char);
        console.log('Character jsonUrl:', char.jsonUrl);
        console.log('Character has characterData:', !!char.characterData);
        
        let data;
        
        // Use stored character data if available and valid, otherwise fetch from URL
        if (char.characterData) {
            // Check if characterData is valid (has at least characterId or basicInfo)
            if (char.characterData.characterId || (char.characterData.basicInfo && char.characterData.basicInfo.fullName)) {
                console.log('Using stored character data for:', char.characterData.characterId || char.characterData.basicInfo?.fullName);
                data = char.characterData;
            } else {
                console.warn('Stored characterData exists but appears invalid, will try to fetch from URL');
                // Fall through to fetch
            }
        }
        
        // If we don't have valid data yet, try to fetch
        if (!data) {
            if (!char.jsonUrl) {
                throw new Error('Character data not available: missing both valid characterData and jsonUrl');
            }
            
            console.log('Fetching character data from:', char.jsonUrl);
            
            // Validate URL format - only allow http/https URLs
            if (typeof char.jsonUrl !== 'string' || char.jsonUrl.trim() === '') {
                throw new Error(`Invalid jsonUrl: ${char.jsonUrl}`);
            }
            
            // Reject file:// and other non-HTTP protocols
            if (!char.jsonUrl.startsWith('http://') && !char.jsonUrl.startsWith('https://')) {
                throw new Error(`Invalid URL protocol. Only http:// and https:// are allowed. Got: ${char.jsonUrl}`);
            }
            
            try {
                const response = await fetch(char.jsonUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                }
                data = await response.json();
            } catch (fetchError) {
                // If fetch fails, provide a clear error message
                const fetchErrorMsg = fetchError?.message || String(fetchError) || 'Unknown fetch error';
                if (fetchErrorMsg.includes('Failed to fetch') || fetchErrorMsg.includes('CORS') || fetchErrorMsg.includes('file://')) {
                    throw new Error(`Network error: Unable to fetch from ${char.jsonUrl}. Make sure you're running from a web server (not file://). Original error: ${fetchErrorMsg}`);
                }
                // Re-throw with better message if it doesn't have one
                if (!(fetchError instanceof Error)) {
                    throw new Error(`Fetch failed: ${fetchErrorMsg}`);
                }
                throw fetchError;
            }
        }
        
        // Final validation
        if (!data) {
            throw new Error('Character data is null or undefined');
        }
        
        if (!data.characterId && (!data.basicInfo || !data.basicInfo.fullName)) {
            throw new Error('Character data is missing required fields (characterId or basicInfo.fullName)');
        }
        
        console.log('Character data loaded successfully:', data.characterId || data.basicInfo?.fullName);
        
        // Display the character book
        try {
            displayCharacterBook(data);
            document.getElementById('bookModal').style.display = 'block';
        } catch (displayError) {
            console.error('Error displaying character book:', displayError);
            throw new Error(`Failed to display character book: ${displayError?.message || String(displayError)}`);
        }
    } catch (error) {
        console.error('Error loading character data:', error);
        console.error('Character object:', char);
        console.error('Error type:', typeof error);
        console.error('Error message:', error?.message);
        console.error('Error string:', String(error));
        console.error('Error stack:', error?.stack);
        
        // Handle different error types
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message || String(error);
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else if (error && typeof error === 'object') {
            errorMessage = error.message || error.toString() || JSON.stringify(error);
        } else {
            errorMessage = String(error);
        }
        
        alert('Failed to load character data: ' + errorMessage);
    }
}

// Display character data in book format
function displayCharacterBook(data) {
    const flipbook = document.getElementById('flipbook');
    flipbook.innerHTML = '';

    // Create cover page
    const coverPage = createCoverPage(data);
    flipbook.appendChild(coverPage);

    // Create content pages
    const pages = createContentPages(data);
    pages.forEach(page => flipbook.appendChild(page));

    // Initialize Turn.js - destroy existing instance if it exists
    const $flipbook = $('#flipbook');
    try {
        // Check if Turn.js is already initialized by trying to get the page count
        const pages = $flipbook.turn('pages');
        if (pages && pages > 0) {
            $flipbook.turn('destroy');
        }
    } catch (e) {
        // Turn.js is not initialized yet, which is fine
        console.log('Turn.js not initialized, will create new instance');
    }
    
    // Initialize Turn.js
    $flipbook.turn({
        width: 800,
        height: 600,
        autoCenter: true,
        elevation: 50,
        gradients: true,
        acceleration: true
    });

    currentBook = data;
    updateControls();
}

function createCoverPage(data) {
    const page = document.createElement('div');
    page.className = 'page cover-page';
    page.innerHTML = `
        <div>
            <div class="cover-title">${data.basicInfo.fullName}</div>
            ${data.basicInfo.aliases && data.basicInfo.aliases.length > 0 ? 
                `<div class="cover-subtitle">"${data.basicInfo.aliases.join('", "')}"</div>` : ''}
            <div class="cover-subtitle">${data.basicInfo.association || ''}</div>
            <div class="cover-classification">CONFIDENTIAL</div>
        </div>
    `;
    return page;
}

function createContentPages(data) {
    const pages = [];

    // Page 1: Basic Information
    pages.push(createPage('Basic Information', `
        <div class="stamp">CLASSIFIED</div>
        <div class="page-section">
            <div class="info-row">
                <span class="info-label">Full Name:</span>
                <span class="info-value">${data.basicInfo.fullName}</span>
            </div>
            ${data.basicInfo.aliases && data.basicInfo.aliases.length > 0 ? `
            <div class="info-row">
                <span class="info-label">Aliases:</span>
                <span class="info-value">${data.basicInfo.aliases.join(', ')}</span>
            </div>` : ''}
            ${data.basicInfo.rank ? `
            <div class="info-row">
                <span class="info-label">Rank:</span>
                <span class="info-value">${data.basicInfo.rank}</span>
            </div>` : ''}
            ${data.basicInfo.association ? `
            <div class="info-row">
                <span class="info-label">Association:</span>
                <span class="info-value">${data.basicInfo.association}</span>
            </div>` : ''}
            ${data.basicInfo.dateOfBirth ? `
            <div class="info-row">
                <span class="info-label">Date of Birth:</span>
                <span class="info-value">${data.basicInfo.dateOfBirth}</span>
            </div>` : ''}
            ${data.basicInfo.placeOfBirth ? `
            <div class="info-row">
                <span class="info-label">Place of Birth:</span>
                <span class="info-value">${data.basicInfo.placeOfBirth}</span>
            </div>` : ''}
            ${data.basicInfo.ethnicity ? `
            <div class="info-row">
                <span class="info-label">Ethnicity:</span>
                <span class="info-value">${data.basicInfo.ethnicity}</span>
            </div>` : ''}
            ${data.basicInfo.status ? `
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">${data.basicInfo.status.toUpperCase()}</span>
            </div>` : ''}
        </div>
        <div class="page-section">
            <div class="section-title">Physical Description</div>
            ${data.physicalDescription.height ? `
            <div class="info-row">
                <span class="info-label">Height:</span>
                <span class="info-value">${data.physicalDescription.height}</span>
            </div>` : ''}
            ${data.physicalDescription.weight ? `
            <div class="info-row">
                <span class="info-label">Weight:</span>
                <span class="info-value">${data.physicalDescription.weight}</span>
            </div>` : ''}
            ${data.physicalDescription.hairColor ? `
            <div class="info-row">
                <span class="info-label">Hair Color:</span>
                <span class="info-value">${data.physicalDescription.hairColor}</span>
            </div>` : ''}
            ${data.physicalDescription.eyeColor ? `
            <div class="info-row">
                <span class="info-label">Eye Color:</span>
                <span class="info-value">${data.physicalDescription.eyeColor}</span>
            </div>` : ''}
            ${data.physicalDescription.scarsAndMarks ? `
            <div class="info-row">
                <span class="info-label">Scars & Marks:</span>
                <span class="info-value">${data.physicalDescription.scarsAndMarks}</span>
            </div>` : ''}
        </div>
    `));

    // Page 2: Background
    if (data.background && data.background.sections) {
        let backgroundContent = '';
        data.background.sections.forEach(section => {
            backgroundContent += `
                <div class="page-section">
                    <div class="section-title">${section.title}</div>
                    ${section.content.map(item => `<div class="list-item">${item}</div>`).join('')}
                </div>
            `;
        });
        pages.push(createPage('Background', backgroundContent));
    }

    // Page 3: Personality
    if (data.personality) {
        let personalityContent = '';
        if (data.personality.coreTraits) {
            personalityContent += `
                <div class="page-section">
                    <div class="section-title">Core Traits</div>
                    ${data.personality.coreTraits.map(trait => `<div class="list-item">${trait}</div>`).join('')}
                </div>
            `;
        }
        if (data.personality.motivations) {
            personalityContent += `
                <div class="page-section">
                    <div class="section-title">Motivations</div>
                    ${data.personality.motivations.map(motivation => `<div class="list-item">${motivation}</div>`).join('')}
                </div>
            `;
        }
        if (data.personality.internalConflicts) {
            personalityContent += `
                <div class="page-section">
                    <div class="section-title">Internal Conflicts</div>
                    ${data.personality.internalConflicts.map(conflict => `<div class="list-item">${conflict}</div>`).join('')}
                </div>
            `;
        }
        pages.push(createPage('Personality Profile', personalityContent));
    }

    // Page 4: Relationships
    if (data.relationships && data.relationships.length > 0) {
        let relationshipsContent = '';
        data.relationships.forEach(rel => {
            relationshipsContent += `
                <div class="page-section">
                    <div class="section-title">${rel.character}</div>
                    <div class="info-row">
                        <span class="info-label">Relationship:</span>
                        <span class="info-value">${rel.relationship}</span>
                    </div>
                    ${rel.details ? rel.details.map(detail => `<div class="list-item">${detail}</div>`).join('') : ''}
                </div>
            `;
        });
        pages.push(createPage('Known Relationships', relationshipsContent));
    }

    // Page 5: Role in Story
    if (data.roleInStory && data.roleInStory.sections) {
        let roleContent = '';
        data.roleInStory.sections.forEach(section => {
            roleContent += `
                <div class="page-section">
                    <div class="section-title">${section.title}</div>
                    ${section.content.map(item => `<div class="list-item">${item}</div>`).join('')}
                </div>
            `;
        });
        pages.push(createPage('Operational Notes', roleContent));
    }

    // Page 6: Character Arc
    if (data.characterArc) {
        let arcContent = `
            <div class="page-section">
                <div class="section-title">Initial State</div>
                <p>${data.characterArc.before}</p>
            </div>
            <div class="page-section">
                <div class="section-title">Final State</div>
                <p>${data.characterArc.after}</p>
            </div>
        `;
        pages.push(createPage('Character Development', arcContent));
    }

    // Page 7: Skills and Notable Moments
    let skillsContent = '';
    if (data.skillsAndAbilities && data.skillsAndAbilities.length > 0) {
        skillsContent += `
            <div class="page-section">
                <div class="section-title">Skills & Abilities</div>
                ${data.skillsAndAbilities.map(skill => `<div class="list-item">${skill}</div>`).join('')}
            </div>
        `;
    }
    if (data.notableMoments && data.notableMoments.length > 0) {
        skillsContent += `
            <div class="page-section">
                <div class="section-title">Notable Moments</div>
                ${data.notableMoments.map(moment => `
                    <div class="list-item">
                        <strong>${moment.timing}:</strong> ${moment.description}
                    </div>
                `).join('')}
            </div>
        `;
    }
    if (skillsContent) {
        pages.push(createPage('Operational Profile', skillsContent));
    }

    // Page 8: Remarks and Awards
    if (data.remarksAndAwards && data.remarksAndAwards.length > 0) {
        let remarksContent = `
            <div class="page-section">
                <div class="section-title">Official Record</div>
                ${data.remarksAndAwards.map(remark => `
                    <div class="list-item">
                        <strong>${remark.translation}</strong><br>
                        <em style="color: #666; font-size: 12px;">${remark.original}</em>
                    </div>
                `).join('')}
            </div>
        `;
        pages.push(createPage('Service Record', remarksContent));
    }

    // Page 9: Thematic Role
    if (data.thematicRole && data.thematicRole.length > 0) {
        let thematicContent = '';
        data.thematicRole.forEach(theme => {
            thematicContent += `
                <div class="page-section">
                    <div class="section-title">${theme.theme}</div>
                    <p>${theme.description}</p>
                </div>
            `;
        });
        pages.push(createPage('Narrative Analysis', thematicContent));
    }

    // Page 10: Series Setup
    if (data.seriesSetup) {
        let seriesContent = '';
        if (data.seriesSetup.nextBook) {
            seriesContent += `
                <div class="page-section">
                    <div class="section-title">Future Developments</div>
                    ${data.seriesSetup.nextBook.map(item => `<div class="list-item">${item}</div>`).join('')}
                </div>
            `;
        }
        if (seriesContent) {
            pages.push(createPage('Series Continuity', seriesContent));
        }
    }

    return pages;
}

function createPage(title, content) {
    const page = document.createElement('div');
    page.className = 'page';
    page.innerHTML = `
        <div class="page-content">
            <div class="page-title">${title}</div>
            ${content}
        </div>
    `;
    return page;
}

function updateControls() {
    try {
        const currentPage = $('#flipbook').turn('page');
        const totalPages = $('#flipbook').turn('pages');
        
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    } catch (e) {
        // Turn.js might not be initialized yet
        console.log('Could not update controls, Turn.js not initialized:', e);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired');
    // Load characters from data.json
    loadCharacters();

    // Modal close button
    document.querySelector('.close-btn').onclick = function() {
        document.getElementById('bookModal').style.display = 'none';
        if (currentBook) {
            try {
                $('#flipbook').turn('destroy');
            } catch (e) {
                // Turn.js might not be initialized
                console.log('Could not destroy Turn.js instance:', e);
            }
        }
    };

    // Navigation buttons
    document.getElementById('prevBtn').onclick = function() {
        $('#flipbook').turn('previous');
        updateControls();
    };

    document.getElementById('nextBtn').onclick = function() {
        $('#flipbook').turn('next');
        updateControls();
    };

    // Click outside modal to close
    window.onclick = function(event) {
        const modal = document.getElementById('bookModal');
        if (event.target == modal) {
            modal.style.display = 'none';
            if (currentBook) {
                try {
                    $('#flipbook').turn('destroy');
                } catch (e) {
                    // Turn.js might not be initialized
                    console.log('Could not destroy Turn.js instance:', e);
                }
            }
        }
    };

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('bookModal');
        if (modal.style.display === 'block') {
            if (e.key === 'ArrowLeft') {
                $('#flipbook').turn('previous');
                updateControls();
            } else if (e.key === 'ArrowRight') {
                $('#flipbook').turn('next');
                updateControls();
            } else if (e.key === 'Escape') {
                modal.style.display = 'none';
                if (currentBook) {
                    try {
                        $('#flipbook').turn('destroy');
                    } catch (e) {
                        // Turn.js might not be initialized
                        console.log('Could not destroy Turn.js instance:', e);
                    }
                }
            }
        }
    });
});

