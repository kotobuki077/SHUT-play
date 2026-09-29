globalThis.SHUT_LOCALES=globalThis.SHUT_LOCALES||{};
globalThis.SHUT_LOCALES.ja={
  title:{
    eyebrow:'THE GATEBOUND JOURNEY',tagline:'閉じて、世界をひらく。',
    lead1:'その一瞬が、運命を変える。',lead2:'失われた門を巡る、開閉の物語。',
    prompt:'A STORY BEYOND THE DOOR',deviceSystem:'DUO GATE SYSTEM · 01',start:'ゲームスタート',newGame:'はじめから',continue:'つづきから',
    tip1:'Space / タップで、その先へ。',tip2:'ヘッドホン推奨 · ローカル自動セーブ'
  },
  menu:{
    eyebrow:'YOUR JOURNEY',preparation:'旅の支度',fold:'扉を閉じる · GACHA',foldHint:'Space で開く / 閉じる',
    story:'旅の地図',storyDesc:'章・ステージを選ぶ',monsters:'モンスター',monstersDesc:'一覧・編成・詳細',synthesis:'合成',synthesisDesc:'素材を選んで強化',
    shop:'旅商人',shopDesc:'道具を買う',partner:'仲間',partnerDesc:'支援と絆',quests:'依頼帳',questsDesc:'挑戦と報酬',
    presents:'贈り物',presentsDesc:'報酬を受け取る',gates:'未知の門',gatesDesc:'発見した道へ',library:'旅の図鑑',libraryDesc:'出会いの記録',
    resumeExpedition:'遠征を再開 →',continueJourney:'旅を続ける →',memoryGate:'記憶の門へ →',readyHint:'旅の準備はできた？ 金色のボタンから次の門へ。'
  },
  settings:{
    button:'設定',buttonAria:'設定を開く',title:'設定',language:'言語',japanese:'日本語',english:'English',
    audio:'サウンド',master:'全体',bgm:'BGM',se:'効果音',mute:'ミュートにする',unmute:'音を戻す',
    playStyle:'プレイスタイル',playStyleHelp:'戦闘中の防御方法を選べます。スマートフォンでOPENのみを使う場合は横向きで画面いっぱいに表示します。召喚はどちらの設定でもCLOSEから始まります。',duoMode:'DUO開閉',openOnly:'OPENのみ',rotateLandscapeTitle:'スマートフォンを横向きにしてください',rotateLandscapeBody:'OPENのみでは横向きで画面いっぱいに表示します。'
  },
  closeMenu:{
    title:'CLOSE MENU',gateTitle:'GACHA GATE',description:'閉じた外側画面で、召喚と旅の状態を確認できます。',gacha:'GACHA',
    gachaCost:'Gold {goldSingle}/{goldTen} · Keys {keySingle}/{keyTen}',stage:'STAGE',rank:'RANK',party:'PARTY',clear:'CLEAR',
    openJourney:'扉を開く · 旅へ戻る',foldHint:'Space で開く / 閉じる'
  },
  gacha:{
    titleTop:'GACHA',inside:'GATE RESULT',keyAria:'鍵',newMonster:'新しい仲間',receive:'受け取る',gateTitle:'MONSTER GATE',
    intro:'通貨を選び、閉じたDuoから門を開いてください。',modeLabel:'召喚通貨',goldMode:'GOLD · ★1〜★3',keyMode:'KEYS · ★4〜★5',singlePull:'1回 · {cost} {currency}',tenPull:'10連 · {cost} {currency}',back:'戻る',openResult:'Duoを開いて結果を見る',
    costNote:'{currency}召喚 · 排出 ★{min}〜★{max} · 保証追加なし',insufficient:'{currency}が足りません（必要 {needed} / 所持 {owned}）',currencyGold:'Gold',currencyKeys:'Keys',
    failure:'召喚を完了できませんでした。通貨と仲間の状態を確認してください。',openToReveal:'DuoをOPENして、門の向こうを確かめます。',rareOmen:'金色の共鳴――高レアの気配がします。',tenResultTitle:'10連結果',tenResultText:'{count}体のモンスターを迎えました。',
    singleResultTitle:'ゲートの中身',singleResultText:'門の向こうから、仲間がやってきました。',newDiscovery:'NEW DISCOVERY',reunion:'REUNION',
    resultMeta:'{attribute}属性 / {type} / ATK {attack} / Lv.{level} · {skill}',done:'受け取る',closeMenu:'CLOSE MENUへ',
    firstCompanionReady:'最初の仲間を迎えました。OPEN MENUへ移動します。'
  },
  tutorial:{
    step:'TUTORIAL {current}/{total}',skip:'SKIP',next:'NEXT',start:'START',
    welcomeTitle:'SHUTへようこそ',welcomeBody:'SHUTはDuoの開閉を戦闘に使うRPGです。まずは5つの基本を覚えましょう。',
    attackTitle:'攻撃',attackBody:'OPENにするだけでは攻撃しません。<b>READY? → GO!</b> の後に入力してバーを開始し、もう一度入力して止めます。1回の判定が3体の攻撃へ適用されます。',
    guardTitle:'防御',guardBody:'敵の攻撃予告中に、自分でDuoをCLOSEして防御します。<b>PERFECT GUARD</b>は被ダメージを10%まで軽減します。強敵からは最低1ダメージを受けます。ゲーム側が自動でCLOSEまたはOPENすることはありません。',
    teamTitle:'3体の仲間',teamBody:'3体は同時に戦い、それぞれ個別のHPを持ちます。敵が落とす卵で仲間が増え、モンスターとGoldを使った合成でレベルアップと進化ができます。',
    gachaTitle:'モンスターゲート',gachaBody:'1回は5 Keys、10連は45 Keysです。最初の45 Keysは贈り物へ届きます。召喚はDuoを閉じた外側画面で行います。',
    practiceTitle:'閉じて、守って。',practiceBody:'光が満ちたら、Spaceまたは下のボタンで自分からDuoを閉じてください。',practiceAction:'閉じて防御',
    perfectGuard:'PERFECT GUARD',guard:'GUARD',tryAgain:'TRY AGAIN',openJourney:'開いて、冒険へ',openNext:'開いて、次へ →'
  },
  battle:{
    timingGuide:'緑でHIT、黄色でPERFECT',closeHere:'ここで閉じる',closeNow:'CLOSE!',readyIdle:'攻撃準備',retreat:'帰還',closeTimeline:'閉じる',playerAria:'主人公',
    instructionDesktop:'入力でバーを開始し、もう一度入力して止める',instructionTouch:'ボタンでバーを開始し、もう一度押して止める',
    encounter:'ENCOUNTER',bossBattle:'BOSS BATTLE',encounterHint:'{instruction} / 戦闘中のCLOSEは防御です',ready:'READY?',readyHint:'構えが整うまで待ってください',go:'GO!',attack:'ATTACK',startTimingHint:'タイミングでタップ',
    attackHintDesktop:'画面のどこでもクリックして止める',attackHintTouch:'画面のどこでもタップして止める',timingTap:'タイミングでタップ / クリック',tapToStart:'「攻撃する」を押してスタート',attackStart:'攻撃する',tapAnywhere:'画面をタップ / クリックして止める',
    miss:'MISS',hit:'HIT',perfect:'PERFECT',missTurn:'ターンを消費しました',coordinatedAttack:'3体の息を合わせた攻撃',nextMoment:'次の一瞬へ。',
    enemyWait:'ENEMY WAIT',enemyWaitTurns:'最短あと{turns}ターンで敵が攻撃',feintWait:'FEINT · 待て',perfectGuard:'PERFECT GUARD',goodGuard:'GOOD GUARD',guard:'GUARD',
    damage:'{name} · {damage} DAMAGE',guardBrand:'SHUT / GUARD',damageOnly:'{damage} DAMAGE',
    actionAttack:'攻撃する · SPACE',actionStart:'バーを開始 · SPACE',actionStop:'ここで止める · SPACE',actionReady:'READY → GOを待つ',actionDefense:'閉じて、防御 · SPACE',actionGuardButton:'ここで防御 · SPACE',actionClosed:'開いて、次へ · ENTER',actionTransition:'次の一瞬へ',actionDialogue:'物語を聞く',actionReward:'門を越えた',actionDefault:'構える',
    skillGauge:'SKILLゲージ {value}',skillReady:'SKILL READY',ultimate:'SKILL',monsterExp:'MONSTER EXP +{exp}',levelUp:'LEVEL UP · {name} Lv.{level}',poison:'POISON',regen:'REGEN',atkDown:'ATK DOWN',
    closedTitle:'Duoを閉じています',closedDescription:'安全状態です。回復アイテムを選ぶと、次に開いた時に使用します。',recoveryTitle:'回復アイテム',recoveryDescription:'GUARD後の回復フェーズです。必要なら回復アイテムを選んでください。',heal:'ヒール',highHeal:'ハイ',elixir:'エリクサー',
    selectedItem:'{item}を次に開いた時に使用',selectedItemOpen:'{item}を使用して次へ',noItemSelected:'未選択 / 残り持込枠 {slots}',openNext:'開いて、次へ →',continueNext:'次へ →',openHint:'EnterまたはボタンでDuoを開く',recoveryHint:'開いたまま次の戦闘フェーズへ進みます',itemUsed:'{item} 使用',hpRecovered:'HP {percent}%回復',
    victory:'VICTORY',stageClear:'STAGE CLEAR',battleClear:'BATTLE CLEAR',rewardObtained:'獲得報酬',firstClearReward:'初回報酬 → PRESENT BOX',noItemDrop:'アイテムドロップなし',newMonster:'NEW MONSTER',monsterJoined:'仲間に加わった',returnBase:'旅の拠点へ',nextBattle:'次の戦闘',restoredHp:'門の加護でHP {percent}%回復',newPath:'A NEW PATH AWAKENS',unknownGate:'未知の門が、応えた。',challengeFromGate:'旅の拠点の「未知の門」から挑戦できます。',
    gateClear:'GATE CLEAR',floorClear:'FLOOR {floor} CLEAR',gateFloorClear:'GATE {floor} CLEAR',earnedGold:'獲得 {gold} G',expeditionReward:'遠征報酬を受け取りました',extract:'報酬を持って帰還',deeper:'さらに奥へ →',
    defeat:'DEFEAT',rewardsKept:'獲得済みGold・経験値は保持されます。',returnHome:'ホームへ',retreatConfirm:'この戦闘から帰還しますか？ 特殊ゲートの挑戦回数は戻りません。',
    monstersCount:'MONSTERS × {count}',battleCount:'BATTLE {current} / {total}{boss}',endlessGate:'第 {floor} 門',itemSlots:'ITEM {slots} / 3',eggDrop:'{name}の卵',keysDrop:'Keys ×{amount}',attribute:'{attribute}属性',enemyMeta:'{attribute} / ATK {attack}',enemyReady:'攻撃準備',enemyTurns:'行動まで',partyRequired:'3体を編成してください',gateFound:'新しい門を発見 · {name}',attributeName:{fire:'火',water:'水',thunder:'雷',earth:'地',wind:'風'}
  },
  monsters:{
    title:'MONSTERS · {count}',all:'すべて解除',sort:'並び順',directionAsc:'昇順',directionDesc:'降順',sortLevel:'レベル',sortRarity:'レア度',sortAttribute:'属性',sortAcquired:'入手順',sortName:'名前',rarityFilter:'レア度',allRarities:'全レア度',favoriteOnly:'お気に入り',lockedOnly:'保護中',empty:'条件に合うモンスターはいません。',party:'編成中',favorite:'お気に入り',notFavorite:'お気に入りにする',locked:'保護中',unlocked:'保護する',details:'詳細',back:'一覧へ戻る',level:'Lv.{level}',exp:'EXP {current} / {next}',expMax:'EXP MAX',hp:'HP',atk:'ATK',def:'DEF',roleLabel:'役割',trainingSpeed:'育成速度',trainingFast:'速い',trainingNormal:'標準',trainingSlow:'遅い',materialExp:'素材EXP {exp}',roles:{striker:'攻撃型',guardian:'防御型',support:'支援型',control:'妨害型',balanced:'バランス型'},skill:'パッシブ',special:'SKILL',specialGauge:'SKILLゲージ',specialGaugeInfo:'SKILLはターン経過で蓄積します。強いSKILLほど発動までに必要なターン数が長くなります。',evolution:'進化',evolvesAt:'Lv.{level}で {name} へ進化',noEvolution:'これ以上進化しません。',teamIn:'編成中',teamAdd:'編成する',chooseReplacement:'交代するモンスターを選ぶ',acquiredOrder:'入手 #{order}'
  },
  synthesis:{
    title:'SYNTHESIS',chooseBase:'強化するベースモンスターを選んでください。',base:'BASE',materials:'MATERIALS',changeBase:'ベースを選び直す',chooseMaterials:'消費する素材を選んでください。編成中・保護中は素材にできません。',selected:'選択 {count}体',preview:'合成内容を確認',selectRequired:'モンスターかEXPストーンを選んでください。',noMaterials:'使用できる素材がありません。',unavailableParty:'編成中',unavailableLocked:'保護中',expGain:'獲得EXP +{exp}',levelChange:'Lv.{before} → Lv.{after}',levelGain:'+{levels} Lv',nextExp:'次Lvまで {exp} EXP',goldCost:'必要Gold {cost}',goldAfter:'合成後Gold {gold}',evolutionReady:'進化条件到達 · {name}',noEvolution:'進化条件には到達しません。',confirmTitle:'合成しますか？',consumed:'消費する素材',confirmWarning:'実行すると選んだ素材は戻りません。',execute:'合成する',warning:'要確認',warningRare:'高レア',warningLevel:'高レベル',warningEvolved:'進化済み',warningFavorite:'お気に入り',warningImportant:'重要',changed:'内容が変わりました。素材を選び直してください。',powerUnites:'力が、ひとつになる。',expStones:'EXPストーン',selectedStones:'選択 {count}個',owned:'所持 {count}',stoneSmall:'EXPストーン・小',stoneMedium:'EXPストーン・中',stoneLarge:'EXPストーン・大'
  },
  shop:{
    title:'旅商人',intro:'旅に必要な回復道具を購入できます。',owned:'所持 {count}',unitPrice:'単価 {price} G',stock:'在庫 {count}',effect:'効果',inventoryCap:'所持上限 {cap}',quantity:'購入数',afterOwned:'購入後 {count}',total:'合計 {total} G',currentGold:'現在 {gold} G',afterGold:'購入後 {gold} G',buy:'購入する',soldOut:'購入できません',selectItem:'商品を選んでください。',assetPlaceholder:'仮アイコン',items:{ITM001:{name:'リペアミスト',effect:'味方全体のHPを30%回復'},ITM002:{name:'ハイリペア',effect:'味方全体のHPを60%回復'},ITM003:{name:'フルコア',effect:'味方全体のHPを100%回復'}}
  },
  monsterData:{
    M001:{name:'フローティアイ'},M002:{name:'ミントビー'},M003:{name:'バブルス'},M004:{name:'ゆらりん'},M005:{name:'ガードッグ'},M006:{name:'スクエア'},M007:{name:'フラワット'},M008:{name:'ストーンロン'},M009:{name:'ラビット'},M010:{name:'キノポン'},M011:{name:'リーファン'},M012:{name:'門番獣グラドッグ'},M013:{name:'樹門王ヴェルデロン'},M014:{name:'アクアミム'},M015:{name:'コイルフィン'},M016:{name:'クラゲット'},M017:{name:'シェルン'},M018:{name:'潮刃ネレイス'},M019:{name:'海門機アクエリア'},M020:{name:'スパークモス'},M021:{name:'フレアギア'},M022:{name:'ボルトホーン'},M023:{name:'アッシュウィスプ'},M024:{name:'双雷機ライラ'},M025:{name:'双雷機レム'},M026:{name:'天鍵機ゼノゲート'},M028:{name:'封鎖執行官ノクティア・決着'},M029:{name:'みかど'},M101:{name:'ミナ'},M102:{name:'セラ'},M103:{name:'カナデ'},EV0A:{name:'オービットアイ'},EV0B:{name:'アストラアイ'},EV1A:{name:'ミントガーディアン'},EV1B:{name:'翡翠の蜂王'},EV2A:{name:'バブルホッパー'},EV2B:{name:'真珠の水竜'}
  },
  passives:{
    names:{aimInsight:'照準のひらめき',tailwind:'追い風',lastWave:'最後の波',tripleBeat:'三拍子',echo:'反響',gateResonance:'門の共鳴',aimInsightPlus:'照準のひらめき＋',starGateResonance:'星門の共鳴',tailwindPlus:'追い風＋',lastWavePlus:'最後の波＋'},
    descriptions:{perfect:'PERFECT時、攻撃力{multiplier}倍。',weakness:'属性有利の相手に、攻撃力{multiplier}倍。',lowHp:'自分のHPが半分以下の時、攻撃力{multiplier}倍。',third:'3回目の攻撃ごとに、攻撃力{multiplier}倍。',guard:'PERFECT GUARDの次の攻撃、攻撃力{multiplier}倍。'}
  },
  items:{ITM001:{name:'リペアミスト',effect:'HP30%回復'},ITM002:{name:'ハイリペア',effect:'HP60%回復'},ITM003:{name:'フルコア',effect:'HP100%回復'},ITM010:{name:'鍵',effect:'5個で1回 / 45個で10連'}},
  questData:{"Q001":{"name":"チュートリアル完了"},"Q006":{"name":"PERFECT ATTACK 5回"},"Q007":{"name":"PERFECT GUARD 5回"},"Q008":{"name":"PERFECT合計25回"},"Q009":{"name":"属性有利で10体撃破"},"Q010":{"name":"敵50体撃破"},"Q011":{"name":"敵100体撃破"},"Q012":{"name":"初ボス撃破"},"Q013":{"name":"Stage 1初クリア"},"Q014":{"name":"Chapter 1クリア"},"Q015":{"name":"Chapter 2クリア"},"Q016":{"name":"Chapter 3クリア"},"Q017":{"name":"Rank 5到達"},"Q018":{"name":"Rank 10到達"},"Q019":{"name":"Rank 20到達"},"Q020":{"name":"敵図鑑10種"},"Q021":{"name":"敵図鑑20種"},"Q024":{"name":"EXPゲート初発見"},"Q025":{"name":"EXPゲート5回クリア"},"Q026":{"name":"GOLDゲート初発見"},"Q027":{"name":"隠しゲート初発見"},"Q028":{"name":"中ボス3体撃破"},"Q029":{"name":"ボス再戦勝利"},"Q035":{"name":"Stageミッション10個達成"},"Q036":{"name":"Stageミッション30個達成"},"Q037":{"name":"BOSS RUSH初クリア"},"Q038":{"name":"試練の塔10F到達"},"Q040":{"name":"エンドレスBattle20"},"Q041":{"name":"エンドレスBattle50"},"Q042":{"name":"初心者クエスト全達成"},"Q043":{"name":"初回プレゼント"},"Q044":{"name":"ガチャ初利用"},"Q045":{"name":"10連ガチャ初利用"}},
  missionData:{"clear":{"name":"ステージを突破"},"perfect":{"name":"PERFECTを1回決める"},"guard":{"name":"PERFECT GUARDを1回決める"}},
  stageData:{"S01-01":{"name":"風渡りの入口","description":"風の門から旅が始まる。"},"S01-02":{"name":"五色の小径","description":"新しい道の向こうへ。"},"S01-03":{"name":"樹根の番所","description":"道を守る強敵を越えよう。"},"S01-04":{"name":"獣道の契り","description":"新しい道の向こうへ。"},"S01-05":{"name":"封鎖執行","description":"静かな門に、ひとつの影。"},"S01-06":{"name":"再起の遺跡","description":"新しい道の向こうへ。"},"S01-07":{"name":"翠環の大門","description":"この世界の門を開こう。"},"S02-01":{"name":"沈み橋","description":"新しい道の向こうへ。"},"S02-02":{"name":"透明回廊","description":"新しい道の向こうへ。"},"S02-03":{"name":"珊瑚兵舎","description":"道を守る強敵を越えよう。"},"S02-04":{"name":"青晶市場","description":"新しい道の向こうへ。"},"S02-05":{"name":"水路包囲戦","description":"仲間が門を開くまで、持ちこたえよう。"},"S02-06":{"name":"執行官再臨","description":"新しい道の向こうへ。"},"S02-07":{"name":"蒼玻璃の海門","description":"この世界の門を開こう。"},"S03-01":{"name":"雷橋の前線","description":"新しい道の向こうへ。"},"S03-02":{"name":"浮遊歯車街","description":"新しい道の向こうへ。"},"S03-03":{"name":"双雷の門","description":"道を守る強敵を越えよう。"},"S03-04":{"name":"試練回廊","description":"新しい道の向こうへ。"},"S03-05":{"name":"決着・封鎖執行官","description":"新しい道の向こうへ。"},"S03-06":{"name":"天鍵中枢","description":"新しい道の向こうへ。"},"S03-07":{"name":"ゼノゲート","description":"この世界の門を開こう。"},"S04-01":{"name":"エデンの庭","description":"空に残された庭園を進む。静かな風の向こうに、幻の気配がある。"}},
  worldData:{"W01":{"name":"翠環草原アルボラ","description":"風が運ぶ花の香り。白い遺跡の向こうで、眠る門が呼んでいる。"},"W02":{"name":"蒼玻璃水都リュミナ","description":"水路に灯りが揺れる街。止まった流れを、もう一度動かそう。"},"W03":{"name":"雷天遺構ヴォルタ","description":"雲の上に残された空の道。遠い鍵の音を追って、最後の門へ。"}},
  questUi:{"title":"依頼帳","active":"今の挑戦","done":"達成した依頼","intro":"今の旅に近い依頼を8件まで表示。達成報酬は「贈り物」に届きます。","reward":"報酬","delivered":"贈り物へ送付済","empty":"このページの依頼はありません。"},
  storyUi:{"mapTitle":"旅の地図","recommendedRank":"推奨Rank","firstClear":"初回","battles":"{count}戦","deploy":"この門へ進む →","continuesTitle":"STORY CONTINUES","forcedHeading":"届かなかった一撃","forcedBody":"攻撃は届かなかった。しかし物語はここで終わらない。","forcedNote":"ミナがあなたの手を握った。もう一度、歩き出そう。","home":"ホームへ","next":"次へ ▷","skip":"スキップ","readSkip":"既読スキップ","auto":"AUTO","autoOn":"AUTO ON"},
  rewardNames:{"monster":"モンスターの卵","boss_core":"ボスコア","exp_small":"経験値石・小","exp_medium":"経験値石・中","exp_large":"経験値石・大","gold":"Gold","rank_xp":"Rank EXP"},
  storyEvents:{"EV001":{"title":"ミナとの遭遇","l0":{"speaker":"ミナ","text":"わっ……開いた。今、触っただけ？"},"l1":{"speaker":"ミナ","text":"私、ミナ。ねえ、向こうを見に行かない？"}},"EV002":{"title":"最初のゲート","l0":{"speaker":"ミナ","text":"抜けた！ ……あはは、足が震えてる。"},"l1":{"speaker":"ミナ","text":"ちょっと休もう。荷物も増えたしね。"}},"EV003":{"title":"五属性","l0":{"speaker":"ミナ","text":"しっ。草の陰、見て。"},"l1":{"speaker":"ミナ","text":"小さいのに、ずいぶん怒ってる……。"}},"EV004":{"title":"樹根の番人","l0":{"speaker":"ミナ","text":"大きい……道いっぱいだ。"},"l1":{"speaker":"ミナ","text":"唸り声が止まった。来るよ！"}},"EV005":{"title":"捕獲チャンス","l0":{"speaker":"ミナ","text":"待って。この子、もう戦いたくなさそう。"},"l1":{"speaker":"ミナ","text":"おいで。一緒に行こう？"}},"EV006":{"title":"封鎖執行官","l0":{"speaker":"ノクティア","text":"止まりなさい。この先は封鎖中よ。"},"l1":{"speaker":"ミナ","text":"街へ行くだけだよ。どうして？"},"l2":{"speaker":"ノクティア","text":"二度は言わない。"}},"EV007":{"title":"届かない攻撃","l0":{"speaker":"ミナ","text":"っ……全然、届かない！"},"l1":{"speaker":"ミナ","text":"下がって！ 私も走るから！"}},"EV008":{"title":"再起","l0":{"speaker":"ミナ","text":"まだ、手が痛む？"},"l1":{"speaker":"ミナ","text":"……うん。じゃあ、今日はゆっくり歩こう。"}},"EV009":{"title":"翠環の主","l0":{"speaker":"ミナ","text":"葉っぱが、こっちを向いた。"},"l1":{"speaker":"ミナ","text":"樹門王……通らせてもらうよ。"}},"EV010":{"title":"第一門解放","l0":{"speaker":"ミナ","text":"海だ！ ねえ、見える？"},"l1":{"speaker":"ミナ","text":"しょっぱい風って、本当にあるんだ。"}},"EV011":{"title":"水都リュミナ","l0":{"speaker":"セラ","text":"そこ、濡れる！ 一歩下がって。"},"l1":{"speaker":"セラ","text":"……よし。私はセラ。門を開けたのは君？"}},"EV012":{"title":"PARTNER契約","l0":{"speaker":"セラ","text":"手、貸して。留め具を締める。"},"l1":{"speaker":"セラ","text":"これで外れない。次は私も行く。"}},"EV013":{"title":"潮刃","l0":{"speaker":"セラ","text":"水音が消えた。ネレイスだ。"},"l1":{"speaker":"セラ","text":"まだ引くな、二波目が来る！"}},"EV014":{"title":"黄金の反応","l0":{"speaker":"セラ","text":"こんな所に点検口？ 図面にない。"},"l1":{"speaker":"セラ","text":"金色に光ってる……開けてみよう。"}},"EV015":{"title":"水路包囲","l0":{"speaker":"セラ","text":"ああ、歯車が噛んでる！"},"l1":{"speaker":"セラ","text":"工具を取って。……いや、前を頼む！"}},"EV016":{"title":"再びノクティア","l0":{"speaker":"ノクティア","text":"またあなたたち。懲りないのね。"},"l1":{"speaker":"ミナ","text":"今度は、引き返さない。"}},"EV017":{"title":"まだ先へ","l0":{"speaker":"ノクティア","text":"私の刃を……止めた？"},"l1":{"speaker":"ノクティア","text":"追わないの？ ……そう。"}},"EV018":{"title":"海門機","l0":{"speaker":"セラ","text":"アクエリア。こんな音、出すなよ。"},"l1":{"speaker":"セラ","text":"止めてくれ。修理は私がやる。"}},"EV019":{"title":"第二門解放","l0":{"speaker":"セラ","text":"動いた……！"},"l1":{"speaker":"セラ","text":"ほら、噴水まで戻った。間に合ったんだ。"}},"EV020":{"title":"雷律の少女","l0":{"speaker":"カナデ","text":"あ、今の音、聞こえた？"},"l1":{"speaker":"カナデ","text":"私、カナデ。静かな道なら案内できるよ。"}},"EV021":{"title":"フェイント","l0":{"speaker":"カナデ","text":"今のは違う。待って……"},"l1":{"speaker":"カナデ","text":"そっち！ 次の音！"}},"EV022":{"title":"双雷機","l0":{"speaker":"カナデ","text":"ライラ？ レムまで？"},"l1":{"speaker":"カナデ","text":"右は私が見る。左をお願い。"}},"EV023":{"title":"再戦の門","l0":{"speaker":"カナデ","text":"この音、前にも聞いた。森の門だ。"},"l1":{"speaker":"カナデ","text":"もう一回、会いに行く？"}},"EV024":{"title":"封鎖の理由","l0":{"speaker":"ノクティア","text":"門を閉じれば、守れると思っていた。"},"l1":{"speaker":"ノクティア","text":"……最後まで、私を止めて。"}},"EV025":{"title":"契約","l0":{"speaker":"ノクティア","text":"手を……貸してもらえる？"},"l1":{"speaker":"ミナ","text":"もちろん。ほら、つかまって。"},"l2":{"speaker":"ノクティア","text":"ありがとう。"}},"EV026":{"title":"終わらない門","l0":{"speaker":"カナデ","text":"うわ、まだ続いてる。"},"l1":{"speaker":"カナデ","text":"今日はどこまで行こうか。帰りの分も残してね。"}},"EV027":{"title":"天鍵","l0":{"speaker":"ミナ","text":"あれがゼノゲート。"},"l1":{"speaker":"セラ","text":"留め具、よし。行ける。"},"l2":{"speaker":"ミナ","text":"うん。みんなで帰ろう。"}},"EV028":{"title":"天鍵変形","l0":{"speaker":"カナデ","text":"待って、音が変わった！"},"l1":{"speaker":"カナデ","text":"大丈夫。もう一度、合わせる。"}},"EV029":{"title":"最後のCLOSE","l0":{"speaker":"ノクティア","text":"来るわ。手を離さないで。"},"l1":{"speaker":"ミナ","text":"まだ、負けない！"}},"EV030":{"title":"第三門解放","l0":{"speaker":"ミナ","text":"……空だ。"},"l1":{"speaker":"セラ","text":"よくやった。ほんとに。"},"l2":{"speaker":"カナデ","text":"静か。やっと、歌えそう。"},"l3":{"speaker":"ノクティア","text":"ええ。聞かせて。"}}},
  skills:{damage:{name:'ブレイクアーツ',description:'高威力の一撃。'},heal:{name:'レスキューヒール',description:'残HP割合が最も低い味方を24%回復。'},poison:{name:'ヴェノムストライク',description:'攻撃し、3ターン毒を与える。'},regen:{name:'リジェネレート',description:'残HP割合が最も低い味方を3ターン継続回復。'},atk_down:{name:'ブレイクシール',description:'攻撃し、敵ATKを2ターン低下。'},noneButShot:{name:'None but shot',description:'刀を大型バズーカへ変形させて攻撃する。'}},
  mikado:{name:'みかど',titleAria:'タイトル画面のみかど',classification:'幻 · ★★★★★★',title:'園芸師',area:'エデン · 幻との遭遇',arrival:'みかど が あらわれた！',skill:'None but shot',skillDescription:'刀を大型バズーカへ変形させて攻撃する。',attackHint:'砲口が光る瞬間に閉じる',world:'エデン',worldDescription:'空に残された庭園。静かな風の中で、幻の気配が揺れる。',stage:'エデンの庭',stageDescription:'空に残された庭園を進む。静かな風の向こうに、幻の気配がある。'},
  common:{confirm:'確認',cancel:'キャンセル',close:'閉じる'},
  save:{newGameConfirm:'現在の冒険を消して、新しい旅を始めますか？',recovery:'保存を読み込めませんでした。退避コピーを残し、新しい旅を始められます。',transactionFailure:'保存できなかったため、変更を元に戻しました。'},
  currency:{keys:'鍵 {count}'},
  fallback:{japaneseOnly:'日本語の代替テキスト'}
};
