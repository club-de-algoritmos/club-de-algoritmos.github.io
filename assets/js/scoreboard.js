_PROBLEM_COLORS = [
    ["#2fcdff", "#000000"],
    ["#ef4242", "#ffffff"],
    ["#2fcd00", "#000000"],
    ["#ffff00", "#000000"],
    ["#ad5fc6", "#ffffff"],
    ["#666666", "#ffffff"],
    ["#734717", "#ffffff"],
    ["#fe9a00", "#000000"],
    ["#ffcdff", "#000000"],
    ["#fffff0", "#000000"],
    ["#8be303", "#000000"],
    ["#80214b", "#ffffff"],
    ["#003366", "#ffffff"],
    ["#ff319c", "#ffffff"]
];

_CR_RANKS = [
    [1200, "newbie"],
    [1400, "pupil"],
    [1600, "specialist"],
    [1900, "expert"],
    [2100, "candidate-master"],
    [2300, "master"],
    [2400, "international-master"],
    [2600, "grandmaster"],
    [3000, "international-grandmaster"],
    [10000, "legendary-grandmaster"],
];

function getClassByRating(rating) {
    if (rating === null || rating === undefined) {
        return "cf-unranked";
    }
    for (const [limit, name] of _CR_RANKS) {
        if (rating < limit) {
            return `cf-${name.toLowerCase().replace(' ', '-')}`;
        }
    }
    // Should not happen
    return "";
}

function createTeamRow(teamResults, problems) {
    const team = teamResults.team;
    const rowClass = teamResults.rank === 1 ? "sortorderswitch" : "";
    let row = $("<tr>", {"class": rowClass});
    row.append($("<td>", {"class": "no-border"}));
    row.append($("<td>", {"class": "scorepl rank"}).text(teamResults.rank));

    const teamGroup = $("<div>", {"class": "team-container"});
    const members = [...team.members];
    // Sorty by max rating first, then by username
    members.sort((a, b) => {
        if (a.max_rating === b.max_rating) {
            return a.codeforces_username.toLowerCase().localeCompare(b.codeforces_username.toLowerCase());
        }
        if (a.max_rating === null) {
            return 1;
        }
        if (b.max_rating === null) {
            return -1;
        }
        return b.max_rating - a.max_rating;
    });
    for (const member of members) {
        let memberTitle = member.name || member.codeforces_username;
        if (member.max_rating) {
            memberTitle += ` (max rating ${member.max_rating})`;
        }
        const memberUrl = `https://codeforces.com/profile/${member.codeforces_username}`;
        const rankClass = getClassByRating(member.max_rating);
        teamGroup.append($("<a>", {"href": memberUrl, "target": "_blank", "title": memberTitle, "class": `team-member ${rankClass}`})
            .text(member.codeforces_username));
    }
    const teamUrl = team.codeforces_id === null ? undefined : `https://codeforces.com/team/${team.codeforces_id}`;
    let teamTitle = team.name;
    if (team.max_rating) {
        teamTitle += ` (max team rating ${team.max_rating})`;
    }
    const teamRankClass = getClassByRating(team.max_rating);
    teamGroup.append($("<div>", {"class": `team-rank ${teamRankClass}`, "title": teamTitle}));
    teamGroup.append(
        $("<a>", {"href": teamUrl, "target": "_blank", "title": teamTitle, "class": "team-name"})
            .text(team.name)
    );
    row.append($("<td>", {"class": "scoretn cl_FFFFFF"})
        .append($("<span>", {"class": "forceWidth"}).append(teamGroup))
        .append($("<span>", {"class": "univ forceWidth"}).text(team.school))
    );

    row.append($("<td>", {"class": "scorenc", "title": "Problemas resueltos"}).text(teamResults.total_solved));
    row.append($("<td>", {"class": "scorett", "title": "Penalty"}).text(teamResults.total_penalty));

    for (const problem of problems) {
        const result = teamResults.results[problem.name];
        const cell = $("<td>", {"class": "score_cell"});
        if (result) {
            const isSolved = result.solving_time != null;
            let scoreClass = isSolved ? "score_correct" : "score_incorrect";
            if (result.is_first_solve) {
                scoreClass += " score_first";
            }
            const triesText = result.tries === 1 ? "1 intento" : `${result.tries} intentos`;
            cell.append(
                $("<a>")
                    .append($("<div>", {"class": scoreClass})
                        .append(isSolved ? result.solving_time : "<br>")
                        .append($("<span>").text(triesText))
                    )
            );
        }
        row.append(cell);
    }

    return row;
}

function createHeaderRow(problems) {
    const headerRow = $("<tr>", {"class": "scoreheader"});
    headerRow.append(
        $("<th>", {"title": "Lugar", "scope": "col", "colspan": 2}).text("#")
    );
    headerRow.append(
        $("<th>", {"title": "Equipo", "scope": "col", "colspan": 1}).text("Equipo")
    );
    headerRow.append(
        $("<th>", {"title": "Problemas resueltos / Penalty", "scope": "col", "colspan": 2}).text("Puntaje")
    );
    for (let i = 0; i < problems.length; i++) {
        const problemName = problems[i].name;
        const [backgroundColor, foregroundColor] = _PROBLEM_COLORS[i];
        headerRow.append(
            $("<th>", {"title": `Problema ${problemName}`, "scope": "col"})
                .append(
                    $("<span>", {
                        "class": "badge problem-badge",
                        "style": `background-color: ${backgroundColor}; border: 1px solid #bf0000`
                    })
                    .append($("<span>", {"style": `color: ${foregroundColor};`}).text(problemName))
                )
        );
    }

    return headerRow;
}

function createStatsRow(problems) {
    const row = $("<tr>", {"style": "border-top: 2px solid black;"});
    row.append($("<td>", {"colspan": 3, "class": "summary", "title": "Estadísticas"}).text("Estadísticas"));
    let totalSolved = 0;
    for (const problem of problems) {
        totalSolved += problem.total_solved;
    }
    row.append($("<td>", {"colspan": 2, "class": "scorenc", "title": "Total de problemas resueltos"})
        .text(totalSolved));
    for (const problem of problems) {
        const first_solve_time = problem.first_solve_time === null ? "---" : `${problem.first_solve_time} min`;
        row.append($("<td>", {"style": "text-align: left;"})
            .append($("<a>")
                .append($("<i>", {"class": "fas fa-thumbs-up fa-fw"}))
                .append($("<span>", {"class": "submcorrect", "title": "Número de envíos aceptados"})
                    .text(problem.total_solved))
                .append($("<br>"))
                .append($("<i>", {"class": "fas fa-thumbs-down fa-fw"}))
                .append($("<span>", {"class": "submreject", "title": "Número de envíos rechazados"})
                    .text(problem.total_submissions - problem.total_solved))
                .append($("<br>"))
                .append($("<i>", {"class": "fas fa-clock fa-fw"}))
                .append($("<span>", {"title": "Tiempo del primer envío aceptado"})
                    .text(first_solve_time))
            )
        );
    }
    return row;
}

function createScoreboardTable(scoreboardData) {
    const columnGroups = $();
    columnGroups.append($("<colgroup>")
        .append("<col>")
        .append("<col>")
        .append("<col>")
        .append("<col>")
        .append("<col>")
    )
    const problemColumnsGroup = $("<colgroup>");
    for (const problem of scoreboardData.problems) {
        problemColumnsGroup.append($("<col>", {"class": "scoreprob"}));
    }
    columnGroups.append(problemColumnsGroup);

    const headerRow = createHeaderRow(scoreboardData.problems);

    let rows = $();
    for (const teamResults of scoreboardData.ranking) {
        rows = rows.add(createTeamRow(teamResults, scoreboardData.problems));
    }

    const statsRow = createStatsRow(scoreboardData.problems);

    return $("<table>", {"class": "d-none d-md-table scoreboard desktop-scoreboard center"})
        .append(columnGroups)
        .append($("<thead>").append(headerRow))
        .append($("<tbody>").append(rows).append(statsRow));
}

function loadScoreboardData(scoreboardUrl) {
    $.getJSON(scoreboardUrl, function(scoreboardData) {
        document.title = `${scoreboardData.contest_name} - Scoreboard`;
        $(".contest-name").html(scoreboardData.contest_name);
        $(".scoreboard-container").append(createScoreboardTable(scoreboardData));
    });
}
