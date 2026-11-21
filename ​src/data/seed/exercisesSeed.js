export const MUSCLE_GROUPS = [
  { id: 'peito', name: 'Peito', macro: 'PEITORAL', pattern: 'PUSH', view: 'front', recoveryHours: 60 },
  { id: 'costas', name: 'Costas', macro: 'COSTAS', pattern: 'PULL', view: 'back', recoveryHours: 64 },
  { id: 'ombros', name: 'Ombros', macro: 'OMBROS', pattern: 'PUSH', view: 'front', recoveryHours: 48 },
  { id: 'biceps', name: 'Bíceps', macro: 'BRACOS', pattern: 'PULL', view: 'front', recoveryHours: 36 },
  { id: 'triceps', name: 'Tríceps', macro: 'BRACOS', pattern: 'PUSH', view: 'back', recoveryHours: 36 },
  { id: 'quadriceps', name: 'Quadríceps', macro: 'PERNAS', pattern: 'LEGS', view: 'front', recoveryHours: 72 },
  { id: 'gluteos', name: 'Glúteos', macro: 'PERNAS', pattern: 'LEGS', view: 'back', recoveryHours: 64 },
  { id: 'posteriores', name: 'Posteriores', macro: 'PERNAS', pattern: 'LEGS', view: 'back', recoveryHours: 64 },
  { id: 'abdomen', name: 'Abdômen', macro: 'CORE', pattern: 'CORE', view: 'front', recoveryHours: 24 },
  { id: 'adutores', name: 'Adutores', macro: 'PERNAS', pattern: 'LEGS', view: 'front', recoveryHours: 48 },
  { id: 'abdutores', name: 'Abdutores', macro: 'PERNAS', pattern: 'LEGS', view: 'back', recoveryHours: 48 },
  { id: 'panturrilhas', name: 'Panturrilhas', macro: 'PERNAS', pattern: 'LEGS', view: 'back', recoveryHours: 30 },
  { id: 'trapezio', name: 'Trapézio', macro: 'COSTAS', pattern: 'PULL', view: 'back', recoveryHours: 48 },
  { id: 'antebracos', name: 'Antebraços', macro: 'BRACOS', pattern: 'PULL', view: 'front', recoveryHours: 24 },
  { id: 'obliquos', name: 'Oblíquos', macro: 'CORE', pattern: 'CORE', view: 'front', recoveryHours: 24 },
  { id: 'lombar', name: 'Lombar', macro: 'COSTAS', pattern: 'PULL', view: 'back', recoveryHours: 60 },
  { id: 'cardio', name: 'Cardio', macro: 'CARDIO', pattern: 'CARDIO', view: 'front', recoveryHours: 18 }
];

export const EQUIPMENT_LIST = [
  { id: 'barbell', name: 'Barra Olímpica e Anilhas', tiers: ['FULL_GYM', 'SMALL_GYM', 'HOME_GYM'] },
  { id: 'dumbbell', name: 'Halteres', tiers: ['FULL_GYM', 'SMALL_GYM', 'HOME_GYM'] },
  { id: 'bench', name: 'Banco Regulável', tiers: ['FULL_GYM', 'SMALL_GYM', 'HOME_GYM'] },
  { id: 'cable', name: 'Polia / Crossover', tiers: ['FULL_GYM', 'SMALL_GYM'] },
  { id: 'machine', name: 'Máquinas Guiadas', tiers: ['FULL_GYM'] },
  { id: 'pullup_bar', name: 'Barra Fixa / Paralelas', tiers: ['FULL_GYM', 'SMALL_GYM', 'HOME_GYM'] },
  { id: 'band', name: 'Elásticos / Superbands', tiers: ['HOME_GYM', 'BODYWEIGHT'] },
  { id: 'bodyweight', name: 'Peso Corporal', tiers: ['FULL_GYM', 'SMALL_GYM', 'HOME_GYM', 'BODYWEIGHT'] }
];

export const INJURY_ZONES = [
  { id: 'shoulder', name: 'Ombros / Manguito' },
  { id: 'lower_back', name: 'Coluna Lombar' },
  { id: 'knee', name: 'Joelhos' },
  { id: 'wrist', name: 'Punhos / Cotovelos' },
  { id: 'neck', name: 'Cervical' }
];

const ex = (
  id, namePt, primaryMuscle, secondaryMuscles, movementPattern,
  equipmentType, trackingType, isCompound, loadRatio, contraindicatedInjuries, instructions
) => ({
  id,
  namePt,
  primaryMuscle,
  secondaryMuscles,
  movementPattern,
  equipmentType,
  trackingType,
  isCompound,
  loadRatio, // Fração do peso corporal para nível intermediário masculino (ajustado no motor)
  contraindicatedInjuries,
  instructions,
  userTechnicalNote: '',
  isFavorite: false,
  isCustom: false
});

export const EXERCISES_SEED = [
  // PEITO
  ex('ex_supino_reto_barra', 'Supino Reto com Barra', 'peito', ['triceps', 'ombros'], 'PUSH', 'barbell', 'WEIGHT_REPS', true, 0.80, ['shoulder'], [
    'Mantenha as escápulas retraídas e encaixadas no banco.',
    'Desça a barra controladamente até a linha média do peitoral.',
    'Empurre de forma explosiva mantendo os pés firmes no chão.'
  ]),
  ex('ex_supino_inclinado_halter', 'Supino Inclinado com Halteres', 'peito', ['ombros', 'triceps'], 'PUSH', 'dumbbell', 'WEIGHT_REPS', true, 0.28, ['shoulder'], [
    'Ajuste o banco entre 30° e 45° para enfatizar a porção clavicular.',
    'Desça os halteres com cotovelos a ~45° do tronco (nunca totalmente abertos).',
    'Suba aproximando os halteres sem bater um no outro.'
  ]),
  ex('ex_supino_maquina', 'Supino Reto na Máquina', 'peito', ['triceps', 'ombros'], 'PUSH', 'machine', 'WEIGHT_REPS', true, 0.72, [], [
    'Ajuste o assento para as manoplas alinharem ao meio do peito.',
    'Controle a fase excêntrica por 2 segundos antes de empurrar.'
  ]),
  ex('ex_crucifixo_maquina', 'Crucifixo Peitoral (Peck Deck)', 'peito', ['ombros'], 'PUSH', 'machine', 'WEIGHT_REPS', false, 0.52, ['shoulder'], [
    'Mantenha leve flexão de cotovelos e peito estufado.',
    'Contraia por 1 segundo no ponto de fechamento máximo.'
  ]),
  ex('ex_crossover_polia', 'Crossover na Polia Alta', 'peito', ['ombros'], 'PUSH', 'cable', 'WEIGHT_REPS', false, 0.22, [], [
    'Incline levemente o tronco à frente com um pé de apoio.',
    'Traga as mãos à frente do quadril esmagando o peitoral.'
  ]),
  ex('ex_flexao_solo', 'Flexão de Braços', 'peito', ['triceps', 'ombros', 'abdomen'], 'PUSH', 'bodyweight', 'BODYWEIGHT_REPS', true, 0, ['wrist'], [
    'Mantenha corpo alinhado da cabeça aos calcanhares (core contraído).',
    'Desça até o peito quase tocar o chão e empurre completamente.'
  ]),

  // COSTAS & TRAPÉZIO & LOMBAR
  ex('ex_puxada_aberta', 'Puxada Aberta (Pegada Pronada)', 'costas', ['biceps', 'trapezio'], 'PULL', 'cable', 'WEIGHT_REPS', true, 0.68, [], [
    'Inicie o movimento deprimindo os ombros antes de flexionar os braços.',
    'Puxe a barra em direção à parte superior do peito sem balançar a lombar.'
  ]),
  ex('ex_puxada_triangulo', 'Puxada com Triângulo (Pegada Neutra)', 'costas', ['biceps', 'antebracos'], 'PULL', 'cable', 'WEIGHT_REPS', true, 0.70, [], [
    'Segure firme no triângulo e mantenha os cotovelos próximos ao tronco.',
    'Alongue completamente o dorsal no topo do movimento.'
  ]),
  ex('ex_remada_curvada', 'Remada Curvada com Barra', 'costas', ['biceps', 'lombar', 'trapezio'], 'PULL', 'barbell', 'WEIGHT_REPS', true, 0.75, ['lower_back'], [
    'Incline o tronco a ~45° com coluna neutra e abdômen travado.',
    'Puxe a barra em direção ao umbigo esmagando as escápulas.'
  ]),
  ex('ex_remada_serrote', 'Remada Unilateral (Serrote)', 'costas', ['biceps', 'antebracos'], 'PULL', 'dumbbell', 'WEIGHT_REPS', true, 0.32, [], [
    'Apoie joelho e mão no banco mantendo a coluna paralela ao chão.',
    'Conduza o cotovelo na direção do quadril em arco controlado.'
  ]),
  ex('ex_remada_maquina', 'Remada Sentada na Máquina (Apoio no Peito)', 'costas', ['trapezio', 'biceps'], 'PULL', 'machine', 'WEIGHT_REPS', true, 0.68, [], [
    'Apoie firmemente o peitoral na almofada para isolar a coluna.',
    'Puxe retraindo totalmente as escápulas e controle a volta.'
  ]),
  ex('ex_pulldown_corda', 'Pulldown na Polia com Barra Reta', 'costas', ['triceps', 'abdomen'], 'PULL', 'cable', 'WEIGHT_REPS', false, 0.34, [], [
    'Braços quase estendidos com leve flexão de cotovelo.',
    'Traga a barra até a coxa focando na contração do grande dorsal.'
  ]),
  ex('ex_barra_fixa', 'Barra Fixa (Pull-Up)', 'costas', ['biceps', 'antebracos'], 'PULL', 'pullup_bar', 'BODYWEIGHT_REPS', true, 0, ['shoulder'], [
    'Pegada pouco mais larga que os ombros.',
    'Suba até o queixo ultrapassar a barra e desça com controle total.'
  ]),
  ex('ex_remada_australiana', 'Remada Invertida (Peso Corporal)', 'costas', ['biceps', 'trapezio'], 'PULL', 'bodyweight', 'BODYWEIGHT_REPS', true, 0, [], [
    'Posicione-se sob uma barra baixa ou suporte firme com corpo reto.',
    'Puxe o peito em direção à barra fechando as escápulas.'
  ]),
  ex('ex_encolhimento_halter', 'Encolhimento de Ombros com Halteres', 'trapezio', ['antebracos'], 'PULL', 'dumbbell', 'WEIGHT_REPS', false, 0.34, ['neck'], [
    'Eleve os ombros em direção às orelhas sem girar a articulação.',
    'Segure 1 segundo no pico de contração.'
  ]),
  ex('ex_hiperextensao_lombar', 'Extensão Lombar no Banco Romano', 'lombar', ['gluteos', 'posteriores'], 'PULL', 'bodyweight', 'BODYWEIGHT_REPS', false, 0, ['lower_back'], [
    'Ajuste o apoio logo abaixo do quadril.',
    'Suba até alinhar o tronco com as pernas sem hiperextender demais.'
  ]),

  // OMBROS
  ex('ex_desenvolvimento_halter', 'Desenvolvimento Sentado com Halteres', 'ombros', ['triceps'], 'PUSH', 'dumbbell', 'WEIGHT_REPS', true, 0.22, ['shoulder'], [
    'Mantenha cotovelos ligeiramente à frente da linha dos ombros (plano escapular).',
    'Empurre acima da cabeça sem arquear a lombar.'
  ]),
  ex('ex_desenvolvimento_maquina', 'Desenvolvimento na Máquina', 'ombros', ['triceps'], 'PUSH', 'machine', 'WEIGHT_REPS', true, 0.48, ['shoulder'], [
    'Ajuste o assento com manoplas na altura do queixo.',
    'Empurre suavemente sem travar os cotovelos no topo.'
  ]),
  ex('ex_elevacao_lateral_halter', 'Elevação Lateral com Halteres', 'ombros', ['trapezio'], 'PUSH', 'dumbbell', 'WEIGHT_REPS', false, 0.11, [], [
    'Eleve os braços até a linha dos ombros liderando com os cotovelos.',
    'Evite balanço de tronco usando carga controlada.'
  ]),
  ex('ex_elevacao_lateral_polia', 'Elevação Lateral Unilateral na Polia', 'ombros', [], 'PUSH', 'cable', 'WEIGHT_REPS', false, 0.10, [], [
    'Posicione a polia na altura do punho para tensão constante no início do arco.',
    'Eleve lateralmente no plano escapular com controle.'
  ]),
  ex('ex_face_pull', 'Face Pull na Polia com Corda', 'ombros', ['trapezio', 'costas'], 'PULL', 'cable', 'WEIGHT_REPS', false, 0.26, [], [
    'Puxe a corda em direção à testa abrindo as mãos e rotacionando externamente.',
    'Excelente para deltoide posterior e saúde do manguito.'
  ]),
  ex('ex_crucifixo_inverso_maq', 'Crucifixo Inverso na Máquina', 'ombros', ['costas', 'trapezio'], 'PULL', 'machine', 'WEIGHT_REPS', false, 0.40, [], [
    'Peito encostado no apoio, braços semiflexionados.',
    'Abra os braços focando no deltoide posterior sem encolher os ombros.'
  ]),
  ex('ex_flexao_pike', 'Flexão Pike (Foco em Ombros)', 'ombros', ['triceps'], 'PUSH', 'bodyweight', 'BODYWEIGHT_REPS', true, 0, ['wrist', 'shoulder'], [
    'Eleve o quadril formando um V invertido.',
    'Desça o topo da cabeça à frente das mãos e empurre.'
  ]),

  // BÍCEPS & ANTEBRAÇOS
  ex('ex_rosca_direta_w', 'Rosca Direta com Barra W', 'biceps', ['antebracos'], 'PULL', 'barbell', 'WEIGHT_REPS', false, 0.32, ['wrist'], [
    'Cotovelos fixos ao lado do corpo, sem jogar a lombar para trás.',
    'Controle a descida em 2 a 3 segundos.'
  ]),
  ex('ex_rosca_inclinada_halter', 'Rosca Inclinada com Halteres', 'biceps', ['antebracos'], 'PULL', 'dumbbell', 'WEIGHT_REPS', false, 0.14, [], [
    'Banco a 45° para alongar ao máximo a cabeça longa do bíceps.',
    'Mantenha os cotovelos apontados para o chão durante toda a série.'
  ]),
  ex('ex_rosca_polia_baixa', 'Rosca Bíceps na Polia Baixa', 'biceps', ['antebracos'], 'PULL', 'cable', 'WEIGHT_REPS', false, 0.28, [], [
    'Mantenha tensão contínua do começo ao fim do movimento.',
    'Flexione totalmente sem mover os ombros à frente.'
  ]),
  ex('ex_rosca_martelo', 'Rosca Martelo com Halteres', 'antebracos', ['biceps'], 'PULL', 'dumbbell', 'WEIGHT_REPS', false, 0.16, [], [
    'Pegada neutra (palmas voltadas uma para a outra).',
    'Forte recrutamento de braquiorradial e braquial.'
  ]),

  // TRÍCEPS
  ex('ex_triceps_corda', 'Tríceps na Polia com Corda', 'triceps', [], 'PUSH', 'cable', 'WEIGHT_REPS', false, 0.30, [], [
    'Cotovelos travados ao lado das costelas.',
    'Afaste as pontas da corda no final da extensão para contração máxima.'
  ]),
  ex('ex_triceps_frances_polia', 'Tríceps Francês na Polia (Acima da Cabeça)', 'triceps', [], 'PUSH', 'cable', 'WEIGHT_REPS', false, 0.28, ['shoulder'], [
    'Incline o tronco e alongue bem a cabeça longa do tríceps atrás da cabeça.',
    'Estenda completamente os cotovelos à frente.'
  ]),
  ex('ex_triceps_testa_halter', 'Tríceps Testa com Halteres', 'triceps', [], 'PUSH', 'dumbbell', 'WEIGHT_REPS', false, 0.13, ['wrist'], [
    'Deitado no banco, leve os halteres em direção às laterais da cabeça.',
    'Estenda mantendo os braços levemente inclinados para trás.'
  ]),
  ex('ex_mergulho_banco', 'Tríceps no Banco (Mergulho)', 'triceps', ['peito', 'ombros'], 'PUSH', 'bodyweight', 'BODYWEIGHT_REPS', true, 0, ['shoulder'], [
    'Mãos apoiadas atrás no banco e tronco próximo a ele.',
    'Desça até 90° nos cotovelos e estenda.'
  ]),

  // PERNAS (QUADRÍCEPS, POSTERIORES, GLÚTEOS, ADUTORES, ABDUTORES, PANTURRILHAS)
  ex('ex_agachamento_livre', 'Agachamento Livre com Barra', 'quadriceps', ['gluteos', 'posteriores', 'lombar'], 'LEGS', 'barbell', 'WEIGHT_REPS', true, 1.00, ['knee', 'lower_back'], [
    'Pés na largura dos ombros com pontas levemente abertas.',
    'Desça mantendo joelhos alinhados aos pés e peito aberto.'
  ]),
  ex('ex_leg_press_45', 'Leg Press 45°', 'quadriceps', ['gluteos', 'posteriores'], 'LEGS', 'machine', 'WEIGHT_REPS', true, 1.90, ['knee'], [
    'Mantenha lombar e glúteos 100% apoiados no encosto durante toda a descida.',
    'Não trave totalmente os joelhos no topo.'
  ]),
  ex('ex_agachamento_bulgaro', 'Agachamento Búlgaro com Halteres', 'quadriceps', ['gluteos', 'posteriores'], 'LEGS', 'dumbbell', 'WEIGHT_REPS', true, 0.20, ['knee'], [
    'Apoie o peito do pé traseiro no banco e desça verticalmente.',
    'Empurre pelo meio do pé dianteiro mantendo o equilíbrio.'
  ]),
  ex('ex_cadeira_extensora', 'Cadeira Extensora', 'quadriceps', [], 'LEGS', 'machine', 'WEIGHT_REPS', false, 0.65, ['knee'], [
    'Alinhe o eixo da máquina exatamente com a articulação do joelho.',
    'Segure 1 segundo no topo e desça devagar.'
  ]),
  ex('ex_agachamento_peso_corp', 'Agachamento Livre (Peso Corporal)', 'quadriceps', ['gluteos'], 'LEGS', 'bodyweight', 'BODYWEIGHT_REPS', true, 0, [], [
    'Desça controladamente até as coxas ficarem paralelas ao chão.',
    'Suba empurrando o chão com os calcanhares.'
  ]),
  ex('ex_stiff_barra', 'Stiff / Levantamento Romeno com Barra', 'posteriores', ['gluteos', 'lombar'], 'LEGS', 'barbell', 'WEIGHT_REPS', true, 0.85, ['lower_back'], [
    'Joelhos semiflexionados e fixos; empurre o quadril para trás.',
    'Mantenha a barra raspando as coxas com coluna reta.'
  ]),
  ex('ex_cadeira_flexora', 'Cadeira Flexora', 'posteriores', ['panturrilhas'], 'LEGS', 'machine', 'WEIGHT_REPS', false, 0.55, [], [
    'Trave bem a almofada sobre as coxas para evitar compensação de quadril.',
    'Flexione completamente levando o calcanhar para baixo do banco.'
  ]),
  ex('ex_mesa_flexora', 'Mesa Flexora', 'posteriores', [], 'LEGS', 'machine', 'WEIGHT_REPS', false, 0.45, [], [
    'Mantenha o quadril pressionado contra o banco durante toda a repetição.',
    'Evite dar trancos na saída.'
  ]),
  ex('ex_elevacao_pelvica', 'Elevação Pélvica com Barra (Hip Thrust)', 'gluteos', ['posteriores'], 'LEGS', 'barbell', 'WEIGHT_REPS', true, 1.05, [], [
    'Apoie as escápulas no banco e mantenha o queixo levemente recolhido.',
    'Suba até o tronco ficar paralelo ao chão contraindo forte o glúteo.'
  ]),
  ex('ex_ponte_gluteo', 'Ponte de Glúteo Unilateral', 'gluteos', ['posteriores'], 'LEGS', 'bodyweight', 'BODYWEIGHT_REPS', true, 0, [], [
    'Deitado de costas, eleve uma perna e empurre o quadril com o calcanhar apoiado.',
    'Segure 1 segundo no topo.'
  ]),
  ex('ex_cadeira_adutora', 'Cadeira Adutora', 'adutores', [], 'LEGS', 'machine', 'WEIGHT_REPS', false, 0.55, [], [
    'Ajuste a abertura conforme sua mobilidade confortável.',
    'Feche com controle e pause brevemente no centro.'
  ]),
  ex('ex_cadeira_abdutora', 'Cadeira Abdutora', 'abdutores', ['gluteos'], 'LEGS', 'machine', 'WEIGHT_REPS', false, 0.60, [], [
    'Empurre os joelhos para fora focando no glúteo médio.',
    'Controle o retorno sem bater as placas.'
  ]),
  ex('ex_panturrilha_em_pe', 'Panturrilha em Pé na Máquina', 'panturrilhas', [], 'LEGS', 'machine', 'WEIGHT_REPS', false, 0.85, [], [
    'Desça totalmente o calcanhar para 1 segundo de pausa alongada.',
    'Suba até a ponta máxima dos pés sem quicar.'
  ]),
  ex('ex_panturrilha_degrau', 'Panturrilha Unilateral no Degrau', 'panturrilhas', [], 'LEGS', 'bodyweight', 'BODYWEIGHT_REPS', false, 0, [], [
    'Apoie a ponta do pé no degrau e controle toda a amplitude.',
    'Faça pausa de 1 segundo embaixo para eliminar o efeito elástico.'
  ]),

  // CORE (ABDÔMEN & OBLÍQUOS — TIPAGEM ESTRITA!)
  ex('ex_prancha_frontal', 'Prancha Frontal Isométrica', 'abdomen', ['obliquos', 'lombar'], 'CORE', 'bodyweight', 'DURATION_SECONDS', false, 0, [], [
    'Apoie antebraços sob os ombros, contraia glúteos e abdômen.',
    'Mantenha a respiração controlada sem deixar o quadril cair.'
  ]),
  ex('ex_abdominal_polia', 'Abdominal Crunch na Polia (Corda)', 'abdomen', ['obliquos'], 'CORE', 'cable', 'WEIGHT_REPS', false, 0.36, ['lower_back'], [
    'Ajoelhe-se mantendo o quadril fixo.',
    'Enrole a coluna levando as costelas em direção à pelve.'
  ]),
  ex('ex_elevacao_pernas', 'Elevação de Pernas Suspenso / Solo', 'abdomen', [], 'CORE', 'bodyweight', 'BODYWEIGHT_REPS', false, 0, [], [
    'Eleve as pernas retrovertendo levemente a pelve no topo.',
    'Desça devagar sem arquear a lombar.'
  ]),
  ex('ex_prancha_lateral', 'Prancha Lateral Isométrica', 'obliquos', ['abdomen'], 'CORE', 'bodyweight', 'DURATION_SECONDS', false, 0, ['shoulder'], [
    'Alinhe cotovelo abaixo do ombro e eleve o quadril formando linha reta.',
    'Execute o tempo indicado para cada lado.'
  ]),
  ex('ex_pallof_press', 'Pallof Press na Polia (Anti-Rotação)', 'obliquos', ['abdomen'], 'CORE', 'cable', 'WEIGHT_REPS', false, 0.16, [], [
    'Fique de lado para a polia e estenda os braços à frente do peito.',
    'Resista à força lateral mantendo o tronco completamente imóvel.'
  ]),

  // CARDIO
  ex('ex_esteira_inclinada', 'Caminhada Inclinada na Esteira', 'cardio', ['panturrilhas', 'gluteos'], 'CARDIO', 'machine', 'DISTANCE_TIME', false, 0, [], [
    'Ajuste inclinação entre 8% e 12% em ritmo firme sem segurar no corrimão.'
  ]),
  ex('ex_bike_ergometrica', 'Bicicleta Ergométrica (Zona 2 / HIIT)', 'cardio', ['quadriceps'], 'CARDIO', 'machine', 'DISTANCE_TIME', false, 0, [], [
    'Ajuste o selim na altura do osso do quadril e mantenha cadência constante.'
  ]),
  ex('ex_corrida_rua', 'Corrida / Trote Livre', 'cardio', ['quadriceps', 'panturrilhas'], 'CARDIO', 'bodyweight', 'DISTANCE_TIME', false, 0, ['knee'], [
    'Mantenha postura ereta e cadência leve para controlar o impacto.'
  ])
];

export const PARTNER_BENEFITS_SEED = [
  { id: 'pb_growth', brandName: 'Suplementos Pro', discountLabel: '15% OFF', couponCode: 'FORJE15', category: 'Suplementação', active: true },
  { id: 'pb_wear', brandName: 'Iron Apparel', discountLabel: '20% OFF', couponCode: 'FORJEWEAR', category: 'Moda Treino', active: true },
  { id: 'pb_farma', brandName: 'Manipulação Fit', discountLabel: '12% OFF', couponCode: 'FORJEFARMA', category: 'Saúde', active: true },
  { id: 'pb_shoes', brandName: 'Grip Training Shoes', discountLabel: '10% OFF', couponCode: 'FORJEGRIP', category: 'Calçados', active: true }
];
