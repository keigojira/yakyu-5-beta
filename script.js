document.addEventListener('DOMContentLoaded', () => {
    // --- 要素の取得 ---
    const inningCountInput = document.getElementById('inningCount');
    const awayPlayersDiv = document.getElementById('awayPlayers'); // このdiv自体は残す
    const homePlayersDiv = document.getElementById('homePlayers'); // このdiv自体は残す
    const startGameButton = document.getElementById('startGameButton');
    const setupSection = document.getElementById('setup-section');
    const scoreboardSection = document.getElementById('scoreboard-section');
    const historySection = document.getElementById('history-section');

    // ★追加または修正: チーム名入力フィールドのID
    const awayTeamNameInput = document.getElementById('awayTeamNameInput'); // このIDをHTMLに追加する必要がある
    const homeTeamNameInput = document.getElementById('homeTeamNameInput'); // このIDをHTMLに追加する必要がある


    const awayTeamNameDisplay = document.getElementById('awayTeamNameDisplay');
    const homeTeamNameDisplay = document.getElementById('homeTeamNameDisplay');
    const currentInningInfo = document.getElementById('currentInningInfo');

    const ballsCountElement = document.getElementById('ballsCount');
    const strikesCountElement = document.getElementById('strikesCount');
    const outsCountElement = document.getElementById('outsCount');

    const firstBase = document.getElementById('firstBase');
    const secondBase = document.getElementById('secondBase');
    const thirdBase = document.getElementById('thirdBase');

    const singleBtn = document.getElementById('singleBtn');
    const doubleBtn = document.getElementById('doubleBtn');
    const tripleBtn = document.getElementById('tripleBtn');
    const homeRunBtn = document.getElementById('homeRunBtn');
    const walkBtn = document.getElementById('walkBtn');
    const strikeOutBtn = document.getElementById('strikeOutBtn');
    const outBtn = document.getElementById('outBtn');
    const sacrificeBtn = document.getElementById('sacrificeBtn');
    const errorBtn = document.getElementById('errorBtn');
    const stealBtn = document.getElementById('stealBtn');

    const advanceRunner1to2Btn = document.getElementById('advanceRunner1to2');
    const advanceRunner2to3Btn = document.getElementById('advanceRunner2to3');
    const advanceRunner3toHBtn = document.getElementById('advanceRunner3toH');
    const forceOutRunnerBtn = document.getElementById('forceOutRunner');
    const clearBasesBtn = document.getElementById('clearBasesBtn');

    const nextInningBtn = document.getElementById('nextInningBtn');
    const endGameBtn = document.getElementById('endGameBtn');

    const currentBatterSelect = document.getElementById('currentBatterSelect');

    const awayPlayerStatsBody = document.getElementById('awayPlayerStatsBody');
    const homePlayerStatsBody = document.getElementById('homePlayerStatsBody');

    const gameHistoryList = document.getElementById('gameHistoryList');
    const clearHistoryButton = document.getElementById('clearHistoryButton');

    // --- ゲームの状態変数 ---
    let totalInnings = 9;
    let currentInning = 1;
    let isTopInning = true; // true: 表, false: 裏

    let balls = 0;
    let strikes = 0;
    let outs = 0;

    let runners = {
        first: null,
        second: null,
        third: null
    }; // 塁上にいる打者の名前を格納

    let awayTeam = { name: '先攻チーム', players: [], runs: 0, hits: 0, errors: 0, inningScores: [] };
    let homeTeam = { name: '後攻チーム', players: [], runs: 0, hits: 0, errors: 0, inningScores: [] };

    let currentTeam;
    let opposingTeam;
    let currentBatterIndex = 0; // 現在の打者のインデックス

    let gameHistory = [];

    // --- ローカルストレージ同期関数 ---
    const updateLocalStorageCounts = () => {
        localStorage.setItem('balls', balls);
        localStorage.setItem('strikes', strikes);
        localStorage.setItem('outs', outs);
        // localStorageの変更を通知 (viewer.htmlで検知される)
        window.dispatchEvent(new Event('storage'));
    };

    // --- UI更新関数 ---
    const updateScoreboard = () => {
        // イニングスコアボードのヘッダーと行を動的に生成
        const scoreboardHeader = document.querySelector('.scoreboard-header');
        const awayScoreboardRow = document.getElementById('awayScoreboardRow');
        const homeScoreboardRow = document.getElementById('homeScoreboardRow');

        // 既存のイニング、RHE, Stats列をクリア
        // ただし、チームラベルは残す
        scoreboardHeader.querySelectorAll('.inning-col, .rhe-col, .stats-col').forEach(el => el.remove());
        awayScoreboardRow.querySelectorAll('.inning-score, .rhe-score, .stats-value').forEach(el => {
            if (!el.classList.contains('team-label')) el.remove();
        });
        homeScoreboardRow.querySelectorAll('.inning-score, .rhe-score, .stats-value').forEach(el => {
            if (!el.classList.contains('team-label')) el.remove();
        });

        for (let i = 1; i <= totalInnings; i++) {
            const inningCol = document.createElement('div');
            inningCol.classList.add('inning-col');
            inningCol.textContent = i;
            // R, H, Eの前にイニングを追加するように変更
            const firstRheCol = scoreboardHeader.querySelector('.rhe-col');
            if (firstRheCol) {
                scoreboardHeader.insertBefore(inningCol, firstRheCol);
            } else {
                scoreboardHeader.appendChild(inningCol); // RHEがない場合は末尾に追加
            }


            const awayInningScore = document.createElement('div');
            awayInningScore.classList.add('inning-score');
            awayInningScore.textContent = awayTeam.inningScores[i - 1] !== undefined ? awayTeam.inningScores[i - 1] : '';
            const awayFirstRheScore = awayScoreboardRow.querySelector('.rhe-score');
            if (awayFirstRheScore) {
                awayScoreboardRow.insertBefore(awayInningScore, awayFirstRheScore);
            } else {
                awayScoreboardRow.appendChild(awayInningScore);
            }

            const homeInningScore = document.createElement('div');
            homeInningScore.classList.add('inning-score');
            homeInningScore.textContent = homeTeam.inningScores[i - 1] !== undefined ? homeTeam.inningScores[i - 1] : '';
            const homeFirstRheScore = homeScoreboardRow.querySelector('.rhe-score');
            if (homeFirstRheScore) {
                homeScoreboardRow.insertBefore(homeInningScore, homeFirstRheScore);
            } else {
                homeScoreboardRow.appendChild(homeInningScore);
            }
        }

        // RHE (Runs, Hits, Errors) 列のヘッダーとスコアを更新または追加
        const rheHeaders = ['R', 'H', 'E'];
        const rheAwayValues = [awayTeam.runs, awayTeam.hits, awayTeam.errors];
        const rheHomeValues = [homeTeam.runs, homeTeam.hits, homeTeam.errors];

        rheHeaders.forEach((label, index) => {
            let rheCol = scoreboardHeader.querySelector(`.rhe-col.${label.toLowerCase()}`);
            if (!rheCol) {
                rheCol = document.createElement('div');
                rheCol.classList.add('rhe-col', label.toLowerCase());
                rheCol.textContent = label;
                scoreboardHeader.appendChild(rheCol);
            }

            let awayRheScore = awayScoreboardRow.querySelector(`.rhe-score.${label.toLowerCase()}`);
            if (!awayRheScore) {
                awayRheScore = document.createElement('div');
                awayRheScore.classList.add('rhe-score', label.toLowerCase());
                awayScoreboardRow.appendChild(awayRheScore);
            }
            awayRheScore.textContent = rheAwayValues[index];

            let homeRheScore = homeScoreboardRow.querySelector(`.rhe-score.${label.toLowerCase()}`);
            if (!homeRheScore) {
                homeRheScore = document.createElement('div');
                homeRheScore.classList.add('rhe-score', label.toLowerCase());
                homeScoreboardRow.appendChild(homeRheScore);
            }
            homeRheScore.textContent = rheHomeValues[index];
        });

        // Current inning display
        currentInningInfo.textContent = `${currentInning}回${isTopInning ? '表' : '裏'}`;

        // Counts display
        ballsCountElement.textContent = balls;
        strikesCountElement.textContent = strikes;
        outsCountElement.textContent = outs;

        // Bases display
        firstBase.classList.toggle('active', runners.first !== null);
        secondBase.classList.toggle('active', runners.second !== null);
        thirdBase.classList.toggle('active', runners.third !== null);

        // Player stats tables
        updatePlayerStatsTable(awayTeam.players, awayPlayerStatsBody);
        updatePlayerStatsTable(homeTeam.players, homePlayerStatsBody);

        updateLocalStorageCounts(); // スコアボード更新時にlocalStorageも更新
    };

    const updateCurrentBatterSelect = () => {
        currentBatterSelect.innerHTML = ''; // Clear existing options
        currentTeam.players.forEach((player, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = player.name;
            currentBatterSelect.appendChild(option);
        });
        currentBatterSelect.value = currentBatterIndex; // Select the current batter
    };

    const updatePlayerStatsTable = (players, tbodyElement) => {
        tbodyElement.innerHTML = '';
        players.forEach((player, index) => {
            const row = tbodyElement.insertRow();
            row.insertCell().textContent = index + 1; // 背番号
            row.insertCell().textContent = player.name; // 選手名
            row.insertCell().textContent = player.atBats + player.walks; // 打席
            row.insertCell().textContent = player.atBats; // 打数
            row.insertCell().textContent = player.hits; // 安打
            row.insertCell().textContent = player.rbi; // 打点
            row.insertCell().textContent = player.runsScored; // 得点
            row.insertCell().textContent = player.walks; // 四球
            row.insertCell().textContent = player.strikeOuts; // 三振
        });
    };

    const addHistoryEntry = (event) => {
        const entry = document.createElement('li');
        entry.innerHTML = `<strong>${currentInning}回${isTopInning ? '表' : '裏'}</strong>: ${event}`;
        gameHistoryList.prepend(entry); // 最新のものを上に追加
        gameHistory.push(event); // データとしても保持
    };

    // --- ゲームロジック ---
    const resetCounts = () => {
        balls = 0;
        strikes = 0;
        outs = 0;
        updateScoreboard();
    };

    const advanceRunners = (bases, batterScored = false) => {
        let runsScoredThisPlay = 0;

        // 本塁打の場合、すべてのランナーと打者が得点
        if (batterScored) {
            if (runners.third) {
                currentTeam.players[runners.third.index].runsScored++;
                runsScoredThisPlay++;
            }
            if (runners.second) {
                currentTeam.players[runners.second.index].runsScored++;
                runsScoredThisPlay++;
            }
            if (runners.first) {
                currentTeam.players[runners.first.index].runsScored++;
                runsScoredThisPlay++;
            }
            currentTeam.players[currentBatterIndex].runsScored++; // 打者も得点
            runsScoredThisPlay++;
            currentTeam.runs += runsScoredThisPlay;
            resetBases(); // 全員得点なので塁をクリア
            return runsScoredThisPlay;
        }

        // ランナーを進める
        if (runners.third && bases >= 1) { // 3塁ランナー
            currentTeam.players[runners.third.index].runsScored++;
            runsScoredThisPlay++;
            runners.third = null;
        }
        if (runners.second && bases >= 2) { // 2塁ランナー (3塁へ)
            runners.third = runners.second;
            runners.second = null;
        } else if (runners.second && bases === 1) { // 2塁ランナー (動かない)
            // 何もしない
        }
        if (runners.first && bases >= 3) { // 1塁ランナー (3塁へ)
            runners.third = runners.first;
            runners.first = null;
        } else if (runners.first && bases >= 2) { // 1塁ランナー (2塁へ)
            runners.second = runners.first;
            runners.first = null;
        } else if (runners.first && bases === 1) { // 1塁ランナー (動かない)
            // 何もしない
        }

        // 新しい打者を塁に置く
        if (bases === 1) {
            runners.first = { name: currentTeam.players[currentBatterIndex].name, index: currentBatterIndex };
        } else if (bases === 2) {
            runners.second = { name: currentTeam.players[currentBatterIndex].name, index: currentBatterIndex };
        } else if (bases === 3) {
            runners.third = { name: currentTeam.players[currentBatterIndex].name, index: currentBatterIndex };
        }

        // 走者が得点した場合
        currentTeam.runs += runsScoredThisPlay;
        return runsScoredThisPlay;
    };


    const resetBases = () => {
        runners = { first: null, second: null, third: null };
        updateScoreboard();
    };

    const nextBatter = () => {
        currentBatterIndex = (currentBatterIndex + 1) % currentTeam.players.length;
        updateCurrentBatterSelect();
    };

    const recordOut = () => {
        outs++;
        addHistoryEntry(`${currentTeam.players[currentBatterIndex].name}がアウトになりました (${outs}アウト)。`);
        resetCounts();
        if (outs >= 3) {
            nextHalfInning();
        } else {
            nextBatter();
        }
    };

    const nextHalfInning = () => {
        // 現在のイニングのスコアを更新
        const inningIndex = currentInning - 1;
        if (isTopInning) {
            awayTeam.inningScores[inningIndex] = awayTeam.runs - (awayTeam.inningScores.slice(0, inningIndex).reduce((a, b) => a + (b || 0), 0));
        } else {
            homeTeam.inningScores[inningIndex] = homeTeam.runs - (homeTeam.inningScores.slice(0, inningIndex).reduce((a, b) => a + (b || 0), 0));
        }

        if (!isTopInning) { // イニングの裏が終了した場合
            currentInning++;
            addHistoryEntry(`${currentInning - 1}回終了。`);
        }
        isTopInning = !isTopInning; // 表と裏を切り替える

        if (currentInning > totalInnings && !isTopInning) { // 最終イニングの裏が終了
            endGame();
            return;
        }

        resetCounts();
        resetBases();
        currentBatterIndex = 0; // イニング開始時は先頭打者に戻る
        setTeamsForInning(); // 表/裏に応じてカレントチームを設定
        updateScoreboard();
        updateCurrentBatterSelect();
    };

    const setTeamsForInning = () => {
        if (isTopInning) {
            currentTeam = awayTeam;
            opposingTeam = homeTeam;
        } else {
            currentTeam = homeTeam;
            opposingTeam = awayTeam;
        }
        // ★修正: チーム名入力フィールドのIDがないため、仮の値を使用
        // HTMLにid="awayTeamNameInput"とid="homeTeamNameInput"を追加する
        // if (awayTeamNameInput) awayTeamNameDisplay.textContent = awayTeamNameInput.value || 'AWAY';
        // if (homeTeamNameInput) homeTeamNameDisplay.textContent = homeTeamNameInput.value || 'HOME';
        awayTeamNameDisplay.textContent = awayTeam.name || 'AWAY';
        homeTeamNameDisplay.textContent = homeTeam.name || 'HOME';
    };


    const endGame = () => {
        addHistoryEntry(`試合終了！`);
        // 最終スコアを履歴に追加
        addHistoryEntry(`最終スコア: ${awayTeam.name} ${awayTeam.runs} - ${homeTeam.name} ${homeTeam.runs}`);

        // 試合終了後のUI表示切り替えなど
        alert(`試合終了！\n${awayTeam.name}: ${awayTeam.runs} Runs, ${awayTeam.hits} Hits, ${awayTeam.errors} Errors\n${homeTeam.name}: ${homeTeam.runs} Runs, ${homeTeam.hits} Hits, ${homeTeam.errors} Errors`);

        scoreboardSection.classList.add('hidden');
        historySection.classList.remove('hidden');
        // 必要に応じてセットアップ画面に戻るボタンなどを表示
    };

    // --- イベントハンドラ ---
    startGameButton.addEventListener('click', () => {
        // ★修正: チーム名入力フィールドが存在しないため、直接テキストを設定
        const awayTeamName = prompt('先攻チームの名前を入力してください:', '先攻チーム') || '先攻チーム';
        const homeTeamName = prompt('後攻チームの名前を入力してください:', '後攻チーム') || '後攻チーム';


        awayTeam.name = awayTeamName;
        homeTeam.name = homeTeamName;
        awayTeamNameDisplay.textContent = awayTeam.name;
        homeTeamNameDisplay.textContent = homeTeam.name;

        totalInnings = parseInt(inningCountInput.value);
        if (isNaN(totalInnings) || totalInnings < 1) {
            alert('有効なイニング数を入力してください。');
            return;
        }

        // 選手名の取得
        awayTeam.players = [];
        document.querySelectorAll('#awayPlayers .player-input-group input').forEach((input, index) => {
            awayTeam.players.push({ name: input.value || `先攻選手${index + 1}`, atBats: 0, hits: 0, rbi: 0, runsScored: 0, walks: 0, strikeOuts: 0 });
        });

        homeTeam.players = [];
        document.querySelectorAll('#homePlayers .player-input-group input').forEach((input, index) => {
            homeTeam.players.push({ name: input.value || `後攻選手${index + 1}`, atBats: 0, hits: 0, rbi: 0, runsScored: 0, walks: 0, strikeOuts: 0 });
        });

        currentInning = 1;
        isTopInning = true;
        awayTeam.runs = 0;
        homeTeam.runs = 0;
        awayTeam.hits = 0;
        homeTeam.hits = 0;
        awayTeam.errors = 0;
        homeTeam.errors = 0;
        awayTeam.inningScores = Array(totalInnings).fill(0); // 各イニングのスコアを0で初期化
        homeTeam.inningScores = Array(totalInnings).fill(0);

        gameHistory = [];
        gameHistoryList.innerHTML = ''; // 履歴をクリア

        setTeamsForInning();
        resetCounts();
        resetBases();
        currentBatterIndex = 0; // 先頭打者から開始

        setupSection.classList.add('hidden');
        scoreboardSection.classList.remove('hidden');
        historySection.classList.add('hidden'); // 試合中は履歴を非表示に

        updateScoreboard();
        updateCurrentBatterSelect();
        addHistoryEntry(`試合開始！ ${awayTeam.name} vs ${homeTeam.name} (${totalInnings}イニング制)`);
    });

    // プレイヤー入力フィールドの初期生成ロジックはHTMLで直接記述したため削除
    // const createPlayerInputFields = (container, count, teamIdPrefix) => { /* ... */ };
    // createPlayerInputFields(awayPlayersDiv, 9, 'away'); // 削除
    // createPlayerInputFields(homePlayersDiv, 9, 'home'); // 削除


    // 打席操作ボタン
    singleBtn.addEventListener('click', () => {
        strikes = 0; // ヒットの場合ストライクはリセット
        balls = 0; // ボールもリセット
        currentTeam.hits++;
        currentTeam.players[currentBatterIndex].atBats++;
        currentTeam.players[currentBatterIndex].hits++;
        const runsScored = advanceRunners(1);
        currentTeam.players[currentBatterIndex].rbi += runsScored;
        addHistoryEntry(`${currentTeam.players[currentBatterIndex].name}がヒットを打ちました。`);
        resetCounts();
        nextBatter();
        updateScoreboard();
    });

    doubleBtn.addEventListener('click', () => {
        strikes = 0; // 塁打の場合ストライクはリセット
        balls = 0; // ボールもリセット
        currentTeam.hits++;
        currentTeam.players[currentBatterIndex].atBats++;
        currentTeam.players[currentBatterIndex].hits++;
        const runsScored = advanceRunners(2);
        currentTeam.players[currentBatterIndex].rbi += runsScored;
        addHistoryEntry(`${currentTeam.players[currentBatterIndex].name}が2塁打を打ちました。`);
        resetCounts();
        nextBatter();
        updateScoreboard();
    });

    tripleBtn.addEventListener('click', () => {
        strikes = 0; // 塁打の場合ストライクはリセット
        balls = 0; // ボールもリセット
        currentTeam.hits++;
        currentTeam.players[currentBatterIndex].atBats++;
        currentTeam.players[currentBatterIndex].hits++;
        const runsScored = advanceRunners(3);
        currentTeam.players[currentBatterIndex].rbi += runsScored;
        addHistoryEntry(`${currentTeam.players[currentBatterIndex].name}が3塁打を打ちました。`);
        resetCounts();
        nextBatter();
        updateScoreboard();
    });

    homeRunBtn.addEventListener('click', () => {
        strikes = 0; // HRの場合ストライクはリセット
        balls = 0; // ボールもリセット
        currentTeam.hits++;
        currentTeam.players[currentBatterIndex].atBats++;
        currentTeam.players[currentBatterIndex].hits++;
        const runsScored = advanceRunners(4, true); // batterScored = true for HR
        currentTeam.players[currentBatterIndex].rbi += runsScored;
        addHistoryEntry(`${currentTeam.players[currentBatterIndex].name}が本塁打を打ちました！`);
        resetCounts();
        nextBatter();
        updateScoreboard();
    });

    walkBtn.addEventListener('click', () => {
        balls = 0; // 四球の場合ボールはリセット
        strikes = 0; // ストライクもリセット
        currentTeam.players[currentBatterIndex].walks++;
        
        // 四球での自動進塁ロジック
        const newRunner = { name: currentTeam.players[currentBatterIndex].name, index: currentBatterIndex };
        let runsScoredThisPlay = 0;

        if (runners.third) { // 3塁ランナーがいる場合、押し出しで得点
            currentTeam.players[runners.third.index].runsScored++;
            runsScoredThisPlay++;
            runners.third = null; // 3塁ランナーは得点したのでクリア
        }
        
        // ランナーの進塁
        runners.third = runners.second;
        runners.second = runners.first;
        runners.first = newRunner;

        currentTeam.runs += runsScoredThisPlay; // 得点加算

        addHistoryEntry(`${currentTeam.players[currentBatterIndex].name}が四球を選びました。`);
        resetCounts();
        nextBatter();
        updateScoreboard();
    });

    strikeOutBtn.addEventListener('click', () => {
        currentTeam.players[currentBatterIndex].atBats++;
        currentTeam.players[currentBatterIndex].strikeOuts++;
        addHistoryEntry(`${currentTeam.players[currentBatterIndex].name}が三振！`);
        recordOut();
    });

    outBtn.addEventListener('click', () => {
        currentTeam.players[currentBatterIndex].atBats++;
        addHistoryEntry(`${currentTeam.players[currentBatterIndex].name}がアウトになりました。`);
        recordOut();
    });

    sacrificeBtn.addEventListener('click', () => {
        // 犠打/犠飛は打数には含まれない
        // 打者には何も記録せず、アウトを記録
        // ランナーがいた場合、進塁させるロジックが必要
        if (confirm('ランナーが進塁しましたか？')) {
            const basesAdvanced = parseInt(prompt('何塁進塁しましたか？ (例: 1, 2, 3)', '1'));
            if (!isNaN(basesAdvanced) && basesAdvanced > 0) {
                const runsScored = advanceRunners(basesAdvanced); // ランナーを進塁させる
                currentTeam.players[currentBatterIndex].rbi += runsScored; // 犠牲バント・フライで得点した場合RBIに加算
                addHistoryEntry(`${currentTeam.players[currentBatterIndex].name}の犠打/犠飛でランナーが進塁/得点しました。`);
            } else {
                 addHistoryEntry(`${currentTeam.players[currentBatterIndex].name}の犠打/犠飛。ランナーは進塁しませんでした。`);
            }
        } else {
            addHistoryEntry(`${currentTeam.players[currentBatterIndex].name}の犠打/犠飛。ランナーは進塁しませんでした。`);
        }
        recordOut(); // 犠打/犠飛はアウトを伴う
    });

    errorBtn.addEventListener('click', () => {
        currentTeam.errors++;
        // エラーでの進塁ロジックは複雑なため、簡略化
        // プレイヤーの打数、安打には含めない
        // まず新しい打者を1塁へ
        const newRunner = { name: currentTeam.players[currentBatterIndex].name, index: currentBatterIndex };
        
        let runsScoredThisPlay = 0;

        // エラーによる進塁（押し出しなど）
        if (runners.third) {
            currentTeam.players[runners.third.index].runsScored++;
            runsScoredThisPlay++;
        }
        // ランナーがいた場合、それぞれ進める
        runners.third = runners.second;
        runners.second = runners.first;
        runners.first = newRunner; // 打者を1塁に

        currentTeam.runs += runsScoredThisPlay;

        addHistoryEntry(`${currentTeam.players[currentBatterIndex].name}が相手チームのエラーで出塁しました。`);
        resetCounts();
        nextBatter();
        updateScoreboard();
    });

    stealBtn.addEventListener('click', () => {
        const baseStolen = prompt('何塁に盗塁しましたか？ (2, 3, HR)', '2');
        let stolenPlayer = null;
        if (baseStolen === '2' && runners.first) {
            stolenPlayer = runners.first;
            runners.second = runners.first;
            runners.first = null;
            addHistoryEntry(`${stolenPlayer.name}が2塁に盗塁成功！`);
        } else if (baseStolen === '3' && runners.second) {
            stolenPlayer = runners.second;
            runners.third = runners.second;
            runners.second = null;
            addHistoryEntry(`${stolenPlayer.name}が3塁に盗塁成功！`);
        } else if (baseStolen === 'HR' && runners.third) {
            stolenPlayer = runners.third;
            currentTeam.players[stolenPlayer.index].runsScored++;
            currentTeam.runs++;
            runners.third = null;
            addHistoryEntry(`${stolenPlayer.name}が本塁に盗塁成功！得点！`);
        } else {
            alert('盗塁できませんでした。');
        }
        updateScoreboard();
    });


    // 塁上操作ボタン
    advanceRunner1to2Btn.addEventListener('click', () => {
        if (runners.first) {
            addHistoryEntry(`${runners.first.name}が2塁へ進塁。`);
            runners.second = runners.first;
            runners.first = null;
            updateScoreboard();
        } else {
            alert('1塁にランナーがいません。');
        }
    });

    advanceRunner2to3Btn.addEventListener('click', () => {
        if (runners.second) {
            addHistoryEntry(`${runners.second.name}が3塁へ進塁。`);
            runners.third = runners.second;
            runners.second = null;
            updateScoreboard();
        } else {
            alert('2塁にランナーがいません。');
        }
    });

    advanceRunner3toHBtn.addEventListener('click', () => {
        if (runners.third) {
            addHistoryEntry(`${runners.third.name}が本塁へ進塁し得点！`);
            currentTeam.players[runners.third.index].runsScored++;
            currentTeam.runs++;
            runners.third = null;
            updateScoreboard();
        } else {
            alert('3塁にランナーがいません。');
        }
    });

    forceOutRunnerBtn.addEventListener('click', () => {
        const baseForOut = prompt('何塁でアウトになりましたか？ (1, 2, 3)', '1');
        let runnerOut = null;
        if (baseForOut === '1' && runners.first) {
            runnerOut = runners.first;
            runners.first = null;
        } else if (baseForOut === '2' && runners.second) {
            runnerOut = runners.second;
            runners.second = null;
        } else if (baseForOut === '3' && runners.third) {
            runnerOut = runners.third;
            runners.third = null;
        }

        if (runnerOut) {
            addHistoryEntry(`${runnerOut.name}が${baseForOut}塁でアウトになりました。`);
            recordOut(); // ランナーがアウトになってもアウトカウントは増える
        } else {
            alert('その塁にランナーがいません。');
        }
    });

    clearBasesBtn.addEventListener('click', () => {
        addHistoryEntry('塁上のランナーをクリアしました。');
        resetBases();
    });


    // イニング操作ボタン
    nextInningBtn.addEventListener('click', () => {
        if (outs < 3) {
            // アウトが3つ未満でも強制的に次のイニングへ行けるようにするが、警告
            if (!confirm('まだ3アウトではありませんが、次のイニングに進みますか？')) {
                return;
            }
        }
        nextHalfInning();
    });

    endGameBtn.addEventListener('click', () => {
        if (confirm('本当に試合を終了しますか？')) {
            endGame();
        }
    });

    // カウントボタン (ボール、ストライク、アウト)
    // このアプリケーションでは打席結果で自動的にリセットされるため、個別のカウントボタンは不要
    // もし手動でボールやストライクを増やすボタンが必要であれば、ここに追加する
    /*
    document.getElementById('addBallBtn').addEventListener('click', () => {
        balls = Math.min(balls + 1, 4); // 最大4ボール
        if (balls === 4) {
            walkBtn.click(); // 4ボールで四球として処理
        }
        updateScoreboard();
    });
    document.getElementById('addStrikeBtn').addEventListener('click', () => {
        strikes = Math.min(strikes + 1, 3); // 最大3ストライク
        if (strikes === 3) {
            strikeOutBtn.click(); // 3ストライクで三振として処理
        }
        updateScoreboard();
    });
    document.getElementById('addOutBtn').addEventListener('click', () => {
        recordOut(); // 直接アウトを追加
    });
    */

    clearHistoryButton.addEventListener('click', () => {
        if (confirm('試合履歴をすべてクリアしてもよろしいですか？')) {
            gameHistory = [];
            gameHistoryList.innerHTML = '';
            alert('試合履歴をクリアしました。');
        }
    });

    // 初期化時にlocalStorageからカウントを読み込む
    // ただし、このファイルでは画面表示用のカウントではなく、ゲームロジックの変数を扱うため、
    // ここで直接更新はせず、updateScoreboard() で表示に反映させる
    const loadInitialCounts = () => {
        balls = parseInt(localStorage.getItem('balls') || '0');
        strikes = parseInt(localStorage.getItem('strikes') || '0');
        outs = parseInt(localStorage.getItem('outs') || '0');
        updateScoreboard(); // 初期表示を更新
    };
    loadInitialCounts(); // ページロード時にlocalStorageからカウントを読み込む
});
