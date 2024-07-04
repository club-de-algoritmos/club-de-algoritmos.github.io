function showReplay() {
    // TODO: Display
    console.log('Showing replay');
}

function resetReplay() {
    if (!window.replay.is_shown) {
        window.replay.is_shown = true;
        showReplay();
    }

    console.log('Resetting replay');
}

window.replay = {
    is_shown: false,
};

window.reset_scoreboard_replay = resetReplay;
