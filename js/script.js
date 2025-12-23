// Sample character data - in production, this would come from a database or API
const characters = [
    {
        id: 'veckurius_cezar',
        name: 'Veckurius Cezar',
        alias: 'Vecko',
        rank: 'Detective',
        association: 'Regionalna Policija Esseg',
        image: 'https://via.placeholder.com/300x400/2d2d2d/d4af37?text=Veckurius+Cezar',
        jsonUrl: '/mnt/user-data/uploads/character_veckurius_cezar.json'
    }
    // Add more characters here as you create them
];

let currentBook = null;

// Initialize character grid
function initializeGrid() {
    const grid = document.getElementById('characterGrid');
    
    characters.forEach(char => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.onclick = () => openCharacterBook(char.jsonUrl);
        
        card.innerHTML = `
            <img src="${char.image}" alt="${char.name}">
            <div class="character-card-info">
                <h3>${char.name}</h3>
                ${char.alias ? `<p class="rank">"${char.alias}"</p>` : ''}
                <p class="rank">${char.rank}</p>
                <p>${char.association}</p>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Open book modal and load character data
async function openCharacterBook(jsonUrl) {
    try {
        const response = await fetch(jsonUrl);
        const data = await response.json();
        
        displayCharacterBook(data);
        document.getElementById('bookModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading character data:', error);
        alert('Failed to load character data');
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

    // Initialize Turn.js
    $('#flipbook').turn('destroy');
    $('#flipbook').turn({
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
    const currentPage = $('#flipbook').turn('page');
    const totalPages = $('#flipbook').turn('pages');
    
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize on page load
    initializeGrid();

    // Modal close button
    document.querySelector('.close-btn').onclick = function() {
        document.getElementById('bookModal').style.display = 'none';
        if (currentBook) {
            $('#flipbook').turn('destroy');
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
                $('#flipbook').turn('destroy');
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
                    $('#flipbook').turn('destroy');
                }
            }
        }
    });
});

