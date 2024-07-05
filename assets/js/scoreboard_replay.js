function formatTime(time) {
    var hours = Math.floor(time / 60);
    var minutes = time % 60;
    var paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${paddedMinutes}`;
}

function isHidden(el) {
    return (el.offsetParent === null)
}

function filterScoreboard(time) {
    let { slider, sliderLabel, scoreTable, problemStartIndex, totalIndex } = window.replay;
    // Ensure the slider and its label are updated
    slider.value = time;
    sliderLabel.innerText = `${time} (${formatTime(time)})`;

    var rowsToSort = [];
    for (var i = 1; i < scoreTable.rows.length; i++) {
        var row = scoreTable.rows[i];
        if (isHidden(row)) {
            // Avoid computations on hidden rows
            continue;
        }

        var totalAc = 0;
        var totalPenalty = 0;
        for (var j = problemStartIndex; j < totalIndex; j++) {
            var cell = row.cells[j];
            var ac = parseInt(cell.dataset.ac);
            var acTime = parseInt(cell.dataset.time);
            var penalty = parseInt(cell.dataset.penalty);
            if (time == 300 || (ac && acTime <= time)) {
                cell.innerHTML = cell.dataset.original;
                totalAc++;
                totalPenalty += penalty;
            } else {
                cell.innerHTML = '';
            }
        }

        var totalCell = row.cells[totalIndex];
        var teamName = totalCell.dataset.team;
        if (time == 300) {
            totalCell.innerHTML = totalCell.dataset.original;
            rowsToSort.push([0, parseInt(totalCell.dataset.order), teamName, row]);
        } else {
            totalCell.innerHTML = `${totalAc} (${totalPenalty})`;
            rowsToSort.push([totalAc, totalPenalty, teamName, row]);
        }
    }
    rowsToSort.sort((a, b) => {
        var [acA, penaltyA, teamNameA, rowA] = a;
        var [acB, penaltyB, teamNameB, rowB] = b;
        if (acA != acB) {
            // More AC first
            return acB - acA;
        }
        if (penaltyA != penaltyB) {
            return penaltyA - penaltyB;
        }
        return teamNameA.toLowerCase().localeCompare(teamNameB.toLowerCase());
    });
    var lastRank = 0;
    for (var i = 0; i < rowsToSort.length; i++) {
        var [ac, penalty, teamName, row] = rowsToSort[i];
        var rank = i + 1;
        if (i > 0) {
            var [prevAc, prevPenalty, prevTeamName, prevRow] = rowsToSort[i - 1];
            if (ac == prevAc && penalty == prevPenalty) {
                // A tie, so keep the same rank
                rank = lastRank;
            }
        }
        lastRank = rank;

        row.cells[0].innerHTML = rank;
        row.parentNode.appendChild(row);
    }
}

function showReplay() {
    var parent = document.body;
    if (!parent) {
        // DOM has not loaded yet
        return false;
    }

    // Define the HTML
    var container = document.createElement('div');
    container.innerHTML = `
        <div style="width: 800px; margin: 5px auto; padding: 5px 10px; text-align: center; font-family: sans-serif; background-color: #d4efff">
            <div style="display: flex">
                <label>0 (0:00)</label>
                <label id="replay-title" style="flex: 1; font-weight: bold"></label>
                <label>300 (5:00)</label>
            </div>
            <input
                type="range" id="replay-time" name="replay-time"
                style="width: 100%"
                step="1" min="0" max="300" value="300"
                oninput="javascript:filterScoreboard(parseInt(this.value))"
            />
            <label id="replay-time-label">300 (5:00)</label>
        </div>
    `;

    // Show replay component at the top
    parent.insertBefore(container, parent.firstChild);

    var title = document.getElementById('replay-title');
    title.innerText = document.title;

    // Remember elements for easy access
    var slider = document.getElementById('replay-time');
    window.replay.slider = slider;
    window.replay.sliderLabel = document.getElementById('replay-time-label');

    // Listen to arrow keys for step by step replay
    document.onkeydown = (e) => {
        if (e.srcElement === window.replay.slider) {
            // Avoid double stepping
            return;
        }

        if (e.keyCode === 37) {
            // Left arrow
            var time = parseInt(slider.value);
            if (time > 0) {
                filterScoreboard(time - 1);
            }
        } else if (e.keyCode === 39) {
            // Right arrow
            var time = parseInt(slider.value);
            if (time < 300) {
                filterScoreboard(time + 1);
            }
        }
    };

    return true;
}

function initializeData() {
    var scoreTable = document.getElementById('myscoretable');
    window.replay.scoreTable = scoreTable;

    // Find the cell index where the problems start at
    var headerRow = scoreTable.rows[0];
    var problemStartIndex = 0;
    while (problemStartIndex < headerRow.cells.length) {
        var cell = headerRow.cells[problemStartIndex];
        if (cell.innerText.trim() == 'A') {
            break;
        }
        problemStartIndex++;
    }
    window.replay.problemStartIndex = problemStartIndex;

    // The cell where the total is displayed is always last
    var totalIndex = headerRow.cells.length - 1;
    window.replay.totalIndex = totalIndex;

    // Skip the first row as that's the header
    for (var i = 1; i < scoreTable.rows.length; i++) {
        var row = scoreTable.rows[i];
        for (var j = problemStartIndex; j < totalIndex; j++) {
            var cell = row.cells[j];
            var content = cell.innerText.trim();
            var ac = 0;
            var submissions = 0;
            var time = 0;
            if (content) {
                var parts = content.split('/');
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

        var totalCell = row.cells[totalIndex];
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
