// Catálogo de exercícios e plano de treino do Gabriel (aprovado em 23/11/2026).
// grupo = exercícios do mesmo grupo são substitutos diretos (mesmo movimento e mesmo músculo)
// area  = músculo, usado para listar "mesmo músculo, outro movimento"
// As fotos ficam em img/<id>-0.jpg e img/<id>-1.jpg (ou no campo img, quando reaproveita outra foto).

const GRUPOS = {
  'peito-reto': 'Peito', 'peito-inclinado': 'Peito', 'peito-crucifixo': 'Peito',
  'costas-puxada': 'Costas', 'costas-remada': 'Costas',
  'ombro-desenvolvimento': 'Ombros', 'ombro-lateral': 'Ombros', 'ombro-posterior': 'Ombros',
  'biceps': 'Bíceps', 'triceps': 'Tríceps',
  'perna-empurrar': 'Pernas (frente da coxa)', 'perna-extensao': 'Pernas (frente da coxa)',
  'posterior-flexao': 'Pernas (posterior)', 'posterior-quadril': 'Pernas (posterior)',
  'gluteo': 'Glúteo', 'panturrilha': 'Panturrilha',
  'abdomen': 'Abdômen e lombar', 'lombar': 'Abdômen e lombar',
};

const CAT = {};
const c = (id, nome, grupo, dica, extra = {}) => { CAT[id] = { nome, grupo, dica, img: id, ...extra }; };

// Peito
c('supino-reto-halteres', 'Supino reto com halteres', 'peito-reto', 'Desça os halteres até a linha do peito, cotovelos um pouco fechados, e suba sem bater um no outro. Anote o peso de cada halter.');
c('supino-reto-barra', 'Supino reto com barra', 'peito-reto', 'Desça a barra até o meio do peito e empurre para cima. Pés firmes no chão. Peça ajuda se a carga for alta.');
c('supino-maquina', 'Supino máquina', 'peito-reto', 'Costas apoiadas, pegadores na altura do peito. Empurre até quase esticar os braços e volte devagar.');
c('supino-articulado', 'Supino reto articulado', 'peito-reto', 'Costas apoiadas no banco, empurre até quase esticar os braços e volte devagar.');
c('supino-smith', 'Supino reto no Smith', 'peito-reto', 'Barra guiada: desça até o meio do peito e empurre. Destrave e trave a barra girando o punho.');
c('supino-inclinado-articulado', 'Supino inclinado articulado', 'peito-inclinado', 'Costas apoiadas no banco, empurre até quase esticar os braços e volte devagar.');
c('supino-inclinado-halteres', 'Supino inclinado com halteres', 'peito-inclinado', 'Banco a uns 30°. Desça os halteres até a parte de cima do peito e suba. Anote o peso de cada halter.');
c('supino-inclinado-barra', 'Supino inclinado com barra', 'peito-inclinado', 'Banco a uns 30°. Desça a barra até a parte de cima do peito e empurre.');
c('supino-inclinado-smith', 'Supino inclinado no Smith', 'peito-inclinado', 'Banco inclinado sob a barra guiada. Desça até a parte de cima do peito e empurre.');
c('crucifixo-maquina', 'Crucifixo máquina', 'peito-crucifixo', 'Feche os braços na frente do peito, aperte um instante e volte devagar.');
c('crucifixo-halteres', 'Crucifixo com halteres', 'peito-crucifixo', 'Deitado, cotovelos levemente dobrados. Abra os braços até alongar o peito e feche como num abraço.');
c('crucifixo-inclinado-halteres', 'Crucifixo inclinado com halteres', 'peito-crucifixo', 'No banco inclinado, abra os braços até alongar o peito e feche como num abraço.');
c('crossover', 'Crossover na polia', 'peito-crucifixo', 'Polias no alto, um passo à frente. Leve as mãos para baixo e para a frente até se encontrarem.');

// Costas
c('puxada-frente', 'Puxada na polia (frente)', 'costas-puxada', 'Puxe a barra até o alto do peito, levando os cotovelos para baixo. Não jogue o tronco para trás.');
c('puxada-neutra', 'Puxada polia romana (pegada neutra)', 'costas-puxada', 'Palmas viradas uma para a outra. Puxe até o alto do peito, cotovelos para baixo.');
c('puxada-supinada', 'Puxada na polia com pegada supinada', 'costas-puxada', 'Palmas viradas para você, mãos na largura dos ombros. Puxe até o alto do peito.');
c('barra-fixa', 'Barra fixa (ou gráviton)', 'costas-puxada', 'Suba até o queixo passar da barra e desça até esticar os braços. No gráviton, anote o peso de ajuda.', { semCarga: true });
c('remada-maquina', 'Remada máquina neutra', 'costas-remada', 'Peito no apoio, puxe levando os cotovelos para trás e aperte as costas por um instante.');
c('remada-baixa', 'Remada baixa na polia', 'costas-remada', 'Tronco parado e reto. Puxe o triângulo até a barriga e aperte as costas.');
c('serrote', 'Remada unilateral com halter (serrote)', 'costas-remada', 'Mão e joelho apoiados no banco. Puxe o halter até o quadril, sem girar o tronco. Séries por lado.');
c('remada-curvada', 'Remada curvada com barra', 'costas-remada', 'Tronco inclinado, costas retas. Puxe a barra até a barriga, sem balançar o corpo.');
c('remada-cavalinho', 'Remada cavalinho', 'costas-remada', 'Costas retas, peito aberto. Puxe os pegadores até o tronco e desça controlando.');

// Ombros
c('desenvolvimento-maquina', 'Desenvolvimento máquina', 'ombro-desenvolvimento', 'Costas apoiadas. Empurre para cima até quase esticar e desça até a altura das orelhas.');
c('desenvolvimento-halteres', 'Desenvolvimento com halteres', 'ombro-desenvolvimento', 'Sentado, costas apoiadas. Suba os halteres acima da cabeça e desça até a altura das orelhas.');
c('desenvolvimento-arnold', 'Desenvolvimento Arnold', 'ombro-desenvolvimento', 'Comece com as palmas viradas para você e gire os punhos enquanto sobe os halteres.');
c('desenvolvimento-smith', 'Desenvolvimento no Smith', 'ombro-desenvolvimento', 'Sentado sob a barra guiada. Desça até a altura do queixo e empurre para cima.');
c('elevacao-lateral', 'Elevação lateral com halter', 'ombro-lateral', 'Suba os braços até a altura dos ombros, cotovelos levemente dobrados, sem balançar o corpo.');
c('elevacao-lateral-sentado', 'Elevação lateral sentado', 'ombro-lateral', 'Sentado, para não roubar com o corpo. Suba os braços até a altura dos ombros.');
c('elevacao-lateral-polia', 'Elevação lateral na polia', 'ombro-lateral', 'Polia baixa, um braço por vez. Suba até a altura do ombro e desça devagar. Séries por lado.');
c('crucifixo-inverso', 'Crucifixo inverso máquina', 'ombro-posterior', 'Abra os braços para trás até a linha dos ombros, sem tirar o peito do apoio.');
c('crucifixo-inverso-halteres', 'Crucifixo inverso com halteres', 'ombro-posterior', 'Tronco inclinado para a frente. Abra os braços para os lados até a linha dos ombros.');
c('crucifixo-inverso-polia', 'Crucifixo inverso na polia', 'ombro-posterior', 'Polias cruzadas na altura dos ombros. Abra os braços para trás, cotovelos quase esticados.');
c('face-pull', 'Face pull na polia', 'ombro-posterior', 'Corda na altura do rosto. Puxe em direção à testa, abrindo os cotovelos para os lados.');

// Bíceps
c('rosca-w', 'Rosca barra W', 'biceps', 'Cotovelos parados ao lado do corpo. Suba sem jogar o tronco e desça devagar.');
c('rosca-45', 'Rosca 45° alternada', 'biceps', 'Banco inclinado, braços soltos para baixo. Suba um de cada vez, cotovelo parado.');
c('rosca-martelo', 'Rosca martelo', 'biceps', 'Palmas viradas para o corpo o tempo todo. Suba sem balançar.');
c('rosca-direta-halteres', 'Rosca direta com halteres', 'biceps', 'Em pé, palmas para a frente. Suba os halteres sem tirar os cotovelos do lado do corpo.');
c('rosca-polia', 'Rosca na polia baixa', 'biceps', 'Barra na polia baixa. Cotovelos parados, suba até contrair o bíceps e desça devagar.');
c('rosca-scott', 'Rosca Scott', 'biceps', 'Braços apoiados no banco Scott. Desça até quase esticar e suba sem tirar os braços do apoio.');
c('rosca-scott-maquina', 'Rosca Scott máquina', 'biceps', 'Braços no apoio da máquina. Suba até contrair e desça devagar, sem soltar o peso.');
c('rosca-concentrada', 'Rosca concentrada', 'biceps', 'Sentado, cotovelo apoiado na parte de dentro da coxa. Suba o halter devagar. Séries por lado.');

// Tríceps
c('triceps-corda', 'Tríceps polia corda', 'triceps', 'Cotovelos colados no corpo. Estique os braços até o fim, abrindo a corda embaixo.');
c('triceps-barra-polia', 'Tríceps polia barra', 'triceps', 'Cotovelos colados no corpo. Empurre a barra para baixo até esticar os braços.');
c('triceps-frances', 'Tríceps francês com halter', 'triceps', 'Sentado, halter atrás da cabeça. Estique os braços para cima sem abrir os cotovelos.');
c('triceps-frances-polia', 'Tríceps francês na polia', 'triceps', 'De costas para a polia, corda atrás da cabeça. Estique os braços para a frente e para cima.');
c('triceps-maquina', 'Tríceps máquina', 'triceps', 'Empurre para baixo até esticar os braços, cotovelos próximos do corpo.');
c('triceps-maquina-extensao', 'Tríceps máquina (extensão)', 'triceps', 'Braços no apoio. Estique os cotovelos até o fim e volte devagar.');
c('triceps-testa', 'Tríceps testa com barra W', 'triceps', 'Deitado, desça a barra em direção à testa dobrando só os cotovelos e estique de volta.');
c('triceps-banco', 'Tríceps no banco', 'triceps', 'Mãos no banco atrás de você. Desça o corpo dobrando os cotovelos e empurre para subir.', { semCarga: true });

// Pernas: frente da coxa (sem agachamento)
c('leg-press', 'Leg press', 'perna-empurrar', 'Pés na largura dos ombros. Desça até os joelhos formarem 90° e suba sem travar os joelhos.');
c('leg-press-alto', 'Leg press com os pés altos', 'perna-empurrar', 'Pés na parte de cima da plataforma, para trabalhar mais glúteo e posterior. Não trave os joelhos.', { img: 'leg-press' });
c('leg-press-unilateral', 'Leg press unilateral', 'perna-empurrar', 'Uma perna por vez, com menos carga. Desça controlando e não trave o joelho. Séries por lado.', { img: 'leg-press' });
c('afundo-halteres', 'Afundo com halteres', 'perna-empurrar', 'Passo à frente, desça até o joelho de trás quase tocar o chão e volte. Séries por lado.');
c('step-up', 'Subida no banco com halteres', 'perna-empurrar', 'Suba no banco empurrando com a perna da frente e desça devagar. Séries por lado.');
c('extensora', 'Cadeira extensora', 'perna-extensao', 'Estique as pernas até o fim, segure um instante e desça devagar.');
c('extensora-unilateral', 'Cadeira extensora unilateral', 'perna-extensao', 'Uma perna por vez. Estique até o fim, segure um instante e desça devagar. Séries por lado.');

// Pernas: posterior
c('flexora', 'Cadeira flexora', 'posterior-flexao', 'Puxe os calcanhares para baixo do banco e volte devagar, sem soltar o peso.');
c('mesa-flexora', 'Mesa flexora', 'posterior-flexao', 'Deitado de bruços. Traga os calcanhares em direção ao glúteo, sem tirar o quadril do banco.');
c('flexora-em-pe', 'Flexora em pé', 'posterior-flexao', 'Uma perna por vez. Traga o calcanhar em direção ao glúteo e desça devagar. Séries por lado.');
c('stiff', 'Stiff com halteres', 'posterior-quadril', 'Joelhos quase esticados, costas retas. Leve o quadril para trás e desça os halteres rente às pernas. Comece leve.');
c('stiff-barra', 'Stiff com barra', 'posterior-quadril', 'Joelhos quase esticados, costas retas. Leve o quadril para trás e desça a barra rente às pernas.');
c('terra-romeno', 'Levantamento terra romeno', 'posterior-quadril', 'Joelhos levemente dobrados, costas retas. Desça a barra até abaixo dos joelhos e suba contraindo o glúteo.');
c('pull-through', 'Pull through na polia', 'posterior-quadril', 'De costas para a polia baixa, corda entre as pernas. Leve o quadril para trás e depois para a frente.');

// Glúteo
c('elevacao-pelvica', 'Elevação pélvica', 'gluteo', 'Costas apoiadas no banco. Suba o quadril até alinhar com os joelhos e aperte o glúteo em cima.');
c('ponte-gluteo', 'Ponte de glúteo com barra', 'gluteo', 'Deitado no chão, barra sobre o quadril. Suba o quadril e aperte o glúteo em cima.');
c('ponte-unilateral', 'Ponte de glúteo unilateral', 'gluteo', 'Deitado, uma perna no ar. Suba o quadril com a outra perna. Séries por lado.', { semCarga: true });
c('gluteo-polia', 'Glúteo na polia (coice)', 'gluteo', 'Tornozeleira na polia baixa. Leve a perna para trás sem arquear a lombar. Séries por lado.');
c('abdutora', 'Cadeira abdutora', 'gluteo', 'Abra as pernas contra a resistência, segure um instante e feche devagar.');

// Panturrilha
c('gemeos-pe', 'Gêmeos em pé', 'panturrilha', 'Suba o máximo na ponta dos pés, segure um instante e desça até alongar bem.');
c('gemeos-sentado', 'Gêmeos sentado', 'panturrilha', 'Suba o máximo na ponta dos pés, segure um instante e desça até alongar.');
c('gemeos-leg-press', 'Gêmeos no leg press', 'panturrilha', 'Só a ponta dos pés na plataforma, pernas quase esticadas. Empurre com a ponta dos pés.');
c('gemeos-halter', 'Gêmeos em pé com halter', 'panturrilha', 'Ponta do pé num degrau, halter na mão. Suba o máximo e desça até alongar.');
c('gemeos-smith', 'Gêmeos no Smith', 'panturrilha', 'Barra guiada nos ombros, ponta dos pés num degrau. Suba o máximo e desça até alongar.');

// Abdômen e lombar
c('abdominal-supra', 'Abdominal supra', 'abdomen', 'Tire só os ombros do chão, contraindo o abdômen. Não puxe o pescoço.', { semCarga: true });
c('abdominal-infra', 'Abdominal infra', 'abdomen', 'Traga os joelhos em direção ao peito tirando o quadril do chão. Desça devagar.', { semCarga: true });
c('abdominal-maquina', 'Abdominal máquina', 'abdomen', 'Enrole o tronco para a frente contraindo o abdômen e volte devagar.');
c('abdominal-polia', 'Abdominal na polia', 'abdomen', 'Ajoelhado, corda atrás da cabeça. Enrole o tronco para baixo, sem puxar com os braços.');
c('elevacao-pernas', 'Elevação de pernas na barra', 'abdomen', 'Pendurado na barra, suba os joelhos (ou as pernas) sem balançar o corpo.', { semCarga: true });
c('prancha', 'Prancha', 'abdomen', 'Corpo reto da cabeça aos pés, abdômen contraído. Não deixe o quadril cair.', { un: 's', semCarga: true });
c('prancha-lateral', 'Prancha lateral', 'abdomen', 'De lado, apoiado no antebraço, corpo reto. Segure sem deixar o quadril cair. Séries por lado.', { un: 's', semCarga: true });
c('hiperextensao', 'Hiperextensão lombar', 'lombar', 'Desça com as costas retas e suba até alinhar o corpo. Não passe da linha reta.', { semCarga: true });
c('superman', 'Superman no chão', 'lombar', 'De bruços, tire braços e pernas do chão ao mesmo tempo, segure um instante e desça.', { semCarga: true });

// Monta um exercício do plano a partir do catálogo
const ex = (id, series, repMin, repMax, descanso) => ({ ex: id, ...CAT[id], series, repMin, repMax, descanso });

const PLANO = {
  treinos: [
    {
      id: 'A', nome: 'Superiores', foco: 'Peito e costas',
      exercicios: [
        ex('supino-reto-halteres', 4, 8, 10, 120), ex('puxada-frente', 4, 8, 12, 90), ex('supino-inclinado-articulado', 3, 8, 12, 90),
        ex('remada-maquina', 4, 8, 12, 90), ex('elevacao-lateral', 3, 12, 15, 60), ex('rosca-w', 3, 10, 12, 60), ex('triceps-corda', 3, 10, 12, 60),
      ],
      cardio: { tipo: 'continuo', min: 20 },
    },
    {
      id: 'B', nome: 'Pernas', foco: 'Frente da coxa e abdômen',
      exercicios: [
        ex('leg-press', 4, 8, 12, 120), ex('extensora', 4, 10, 15, 60), ex('flexora', 3, 10, 12, 60),
        ex('gemeos-pe', 4, 10, 15, 60), ex('abdominal-infra', 3, 10, 15, 45), ex('prancha', 3, 30, 45, 45),
      ],
      cardio: { tipo: 'continuo', min: 25 },
    },
    {
      id: 'C', nome: 'Empurrar', foco: 'Peito, ombro e tríceps',
      exercicios: [
        ex('supino-inclinado-halteres', 4, 8, 10, 120), ex('desenvolvimento-maquina', 4, 8, 12, 90), ex('crucifixo-maquina', 3, 10, 15, 60),
        ex('elevacao-lateral', 4, 12, 15, 60), ex('triceps-frances', 3, 10, 12, 60), ex('triceps-maquina', 3, 10, 12, 60),
      ],
      cardio: { tipo: 'continuo', min: 20 },
    },
    {
      id: 'D', nome: 'Puxar', foco: 'Costas, bíceps e ombro de trás',
      exercicios: [
        ex('puxada-neutra', 4, 8, 12, 90), ex('remada-baixa', 4, 8, 12, 90), ex('serrote', 3, 10, 12, 60), ex('crucifixo-inverso', 3, 12, 15, 60),
        ex('rosca-45', 3, 10, 12, 60), ex('rosca-martelo', 3, 10, 12, 60), ex('hiperextensao', 3, 10, 12, 60),
      ],
      cardio: { tipo: 'continuo', min: 20 },
    },
    {
      id: 'E', nome: 'Pernas', foco: 'Posterior, glúteo e condicionamento',
      exercicios: [
        ex('stiff', 3, 10, 12, 90), ex('leg-press-alto', 3, 10, 12, 120), ex('flexora', 4, 10, 12, 60),
        ex('elevacao-pelvica', 3, 10, 12, 90), ex('gemeos-sentado', 3, 12, 15, 60), ex('abdominal-supra', 3, 12, 15, 45),
      ],
      cardio: { tipo: 'intervalado', forte: 60, leve: 60, voltas: 8, aparelho: 'eliptico' },
    },
  ],
};
