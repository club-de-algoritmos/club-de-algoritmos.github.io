function formatTime(time) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${paddedMinutes}`;
}

function isHidden(el) {
    return (el.offsetParent === null)
}

function setTime(time) {
    let { slider, sliderLabel } = window.replay;
    slider.value = time;
    sliderLabel.innerText = `${time} (${formatTime(time)})`;
    if (time >= 300) {
        sliderLabel.style.color = 'red';
    } else if (time >= 240) {
        sliderLabel.style.color = 'blue';
    } else {
        sliderLabel.style.color = 'black';
    }
}

function filterScoreboard(time) {
    setTime(time);

    let { scoreTable, problemStartIndex, totalIndex } = window.replay;
    const rowsToSort = [];
    const sortedRows = [];
    for (let i = 0; i < scoreTable.rows.length; i++) {
        const row = scoreTable.rows[i];
        if (i == 0 || isHidden(row)) {
            // Avoid computations on hidden rows
            sortedRows.push(row);
            continue;
        }

        let totalAc = 0;
        let totalPenalty = 0;
        for (let j = problemStartIndex; j < totalIndex; j++) {
            const cell = row.cells[j];
            const ac = parseInt(cell.dataset.ac);
            const acTime = parseInt(cell.dataset.time);
            const penalty = parseInt(cell.dataset.penalty);
            if (time == 300 || (ac && acTime <= time)) {
                cell.innerHTML = cell.dataset.original;
                totalAc++;
                totalPenalty += penalty;
            } else {
                cell.innerHTML = '';
            }
        }

        const totalCell = row.cells[totalIndex];
        const teamName = totalCell.dataset.team;
        if (time == 300) {
            totalCell.innerHTML = totalCell.dataset.original;
            rowsToSort.push([0, parseInt(totalCell.dataset.order), teamName, row]);
        } else {
            totalCell.innerHTML = `${totalAc} (${totalPenalty})`;
            rowsToSort.push([totalAc, totalPenalty, teamName, row]);
        }
    }

    rowsToSort.sort((a, b) => {
        const [acA, penaltyA, teamNameA, rowA] = a;
        const [acB, penaltyB, teamNameB, rowB] = b;
        if (acA != acB) {
            // More AC first
            return acB - acA;
        }
        if (penaltyA != penaltyB) {
            return penaltyA - penaltyB;
        }
        return teamNameA.toLowerCase().localeCompare(teamNameB.toLowerCase());
    });

    let lastRank = 0;
    for (let i = 0; i < rowsToSort.length; i++) {
        const [ac, penalty, teamName, row] = rowsToSort[i];
        let rank = i + 1;
        if (i > 0) {
            const [prevAc, prevPenalty, prevTeamName, prevRow] = rowsToSort[i - 1];
            if (ac == prevAc && penalty == prevPenalty) {
                // A tie, so keep the same rank
                rank = lastRank;
            }
        }
        lastRank = rank;

        row.cells[0].innerHTML = rank;
        sortedRows.push(row);
    }

    const rowContainer = scoreTable.rows[0].parentNode;
    rowContainer.replaceChildren(...sortedRows);
}

function showReplay() {
    const parent = document.body;
    if (!parent) {
        // DOM has not loaded yet
        return false;
    }

    // Define the HTML
    const container = document.createElement('div');
    container.innerHTML = `
        <div style="width: 800px; margin: 5px auto; padding: 5px 10px; text-align: center; font-family: sans-serif; background-color: #d4efff">
            <label id="replay-title" style="font-weight: bold"></label>
            <input
                type="range" id="replay-time" name="replay-time"
                style="width: 100%"
                step="1" min="0" max="300"
                oninput="javascript:filterScoreboard(parseInt(this.value))"
            />
            <div style="display: flex">
                <label>0 (0:00)</label>
                <label id="replay-time-label" style="flex: 1"></label>
                <label>300 (5:00)</label>
            </div>
        </div>
    `;

    // Show replay component at the top
    parent.insertBefore(container, parent.firstChild);

    const title = document.getElementById('replay-title');
    title.innerText = document.title;

    // Remember elements for easy access
    const slider = document.getElementById('replay-time');
    window.replay.slider = slider;
    window.replay.sliderLabel = document.getElementById('replay-time-label');

    // Initialize the components
    setTime(300);

    // Listen to arrow keys for step by step replay
    document.onkeydown = (e) => {
        if (e.srcElement === window.replay.slider) {
            // Avoid double stepping
            return;
        }

        if (e.keyCode === 37) {
            // Left arrow
            const time = parseInt(slider.value);
            if (time > 0) {
                filterScoreboard(time - 1);
            }
        } else if (e.keyCode === 39) {
            // Right arrow
            const time = parseInt(slider.value);
            if (time < 300) {
                filterScoreboard(time + 1);
            }
        }
    };

    return true;
}

function initializeData() {
    const scoreTable = document.getElementById('myscoretable');
    window.replay.scoreTable = scoreTable;

    // Find the cell index where the problems start at
    const headerRow = scoreTable.rows[0];
    let problemStartIndex = 0;
    while (problemStartIndex < headerRow.cells.length) {
        const cell = headerRow.cells[problemStartIndex];
        if (cell.innerText.trim() == 'A') {
            break;
        }
        problemStartIndex++;
    }
    window.replay.problemStartIndex = problemStartIndex;

    // The cell where the total is displayed is always last
    const totalIndex = headerRow.cells.length - 1;
    window.replay.totalIndex = totalIndex;

    // Skip the first row as that's the header
    for (let i = 1; i < scoreTable.rows.length; i++) {
        const row = scoreTable.rows[i];
        for (let j = problemStartIndex; j < totalIndex; j++) {
            const cell = row.cells[j];
            const content = cell.innerText.trim();
            let ac = 0;
            let submissions = 0;
            let time = 0;
            if (content) {
                const parts = content.split('/');
                submissions = parseInt(parts[0]);
                if (parts[1] != '-') {
                    time = parseInt(parts[1]);
                    ac = 1;
                }
            }

            // Store parsed data
            cell.dataset.ac = ac;
            cell.dataset.time = time;
            cell.dataset.penalty = ac == 0 ? 0 : time + 20 * (submissions - 1);
            // Store original HTML for eventual correctness
            cell.dataset.original = cell.innerHTML;
        }

        const totalCell = row.cells[totalIndex];
        // Store original HTML for eventual correctness
        totalCell.dataset.original = totalCell.innerHTML;
        // Store the original order to be 100% accurate when displaying final results
        totalCell.dataset.order = i;
        // Store the assumed team name to keep a consistent ordering on ties
        totalCell.dataset.team = row.cells[problemStartIndex - 1].innerText.trim();
    }
}

function resetReplay() {
    if (!window.replay.isInitialized) {
        if (!showReplay()) {
            return;
        }

        initializeData();
        window.replay.isInitialized = true;
        return;
    }

    filterScoreboard(300);
}

window.replay = {
    isInitialized: false,
};

window.reset_scoreboard_replay = resetReplay;
