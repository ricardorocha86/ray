# Roteiro de narração — montagem do perceptron na protoboard

Gerado automaticamente a partir de `src/scene.js` e `src/falas.js`. Os tempos batem com o vídeo;
“Fala” é o texto narrado e “Legenda” é o que aparece escrito na tela.

Duração total: **11:10**


## Perceptron físico na protoboard

**0:00–0:11**

**Fala:** Neste vídeo, vamos montar na protoboard o perceptron que implementa a função lógica AND. Passo a passo, furo por furo.

**Legenda:** Neste vídeo, vamos montar na protoboard o perceptron que implementa a função AND — passo a passo, furo por furo.


## VISÃO GERAL · O que vamos montar

**0:11–0:23**

**Fala:** O treinamento acontece no R. O circuito apenas executa a regra aprendida: os pesos viram resistores, e o viés vira uma tensão de referência.

**Legenda:** O treinamento acontece no R. O circuito apenas executa a regra aprendida: os pesos viram resistores e o viés vira uma tensão de referência.

**0:23–0:43**

**Fala:** Com os pesos iguais a dois e o viés igual a menos três, usamos R1 e R2 de dez quilo-ohms, R0 de quatro vírgula sete quilo-ohms, e um limiar de cerca de um vírgula oito volts. O LED acende só quando as duas entradas valem um.

**Legenda:** Com w1 = w2 = 2 e b = −3, usamos R1 = R2 = 10 kΩ, R0 = 4,7 kΩ e um limiar de cerca de 1,8 V. O LED acende só quando x1 = x2 = 1.


## VISÃO GERAL · Material

**0:43–1:03**

**Fala:** Separe o material: a protoboard, uma fonte regulada de cinco volts, o LM358, duas chaves, um potenciômetro de dez quilo-ohms, os resistores, um LED, um capacitor de cem nanofarads, jumpers e um multímetro.

**Legenda:** Separe o material: protoboard, fonte regulada de 5 V, LM358, duas chaves, potenciômetro de 10 kΩ, resistores, LED, capacitor de 100 nF, jumpers e multímetro.

**1:03–1:20**

**Fala:** Identifique os resistores pelas cores. O de dez quilo-ohms é marrom, preto e laranja. O de quatro vírgula sete quilo-ohms é amarelo, violeta e vermelho. E o de um quilo-ohm é marrom, preto e vermelho.

**Legenda:** Identifique os resistores pelas cores: 10 kΩ é marrom-preto-laranja, 4,7 kΩ é amarelo-violeta-vermelho e 1 kΩ é marrom-preto-vermelho.


## ANTES DE COMEÇAR · Conhecendo a protoboard

**1:20–1:34** · _Na tela:_ Cada coluna tem dois grupos de 5 furos ligados: a–e e f–j

**Fala:** Na protoboard, os cinco furos de uma mesma coluna numerada estão ligados entre si: as linhas de A até E, na metade de cima, e as linhas de F até J, na metade de baixo.

**Legenda:** Na protoboard, os cinco furos de uma mesma coluna numerada estão ligados entre si: a–e na metade de cima e f–j na metade de baixo.

**1:34–1:44** · _Na tela:_ O canal central isola as duas metades

**Fala:** O canal central separa as duas metades. É sobre ele que o chip vai ser encaixado, para que os pinos de um lado não encostem nos do outro.

**Legenda:** O canal central separa as duas metades. É sobre ele que o chip será encaixado, para que os pinos de um lado não encostem nos do outro.

**1:44–1:58** · _Na tela:_ Trilhas: + (linha vermelha) e − (linha azul)

**Fala:** As trilhas das bordas levam a alimentação. Neste vídeo, a trilha de fora é o positivo, de cinco volts, marcada com a linha vermelha. E a trilha de dentro é o GND, o terra, marcada com a linha azul.

**Legenda:** As trilhas das bordas levam a alimentação. Neste vídeo, a trilha de fora é +5 V (linha vermelha) e a de dentro é GND (linha azul).

**1:58–2:08** · _Na tela:_ Trilha interrompida no meio? Una com um jumper

**Fala:** Confira as marcas da sua protoboard. Em alguns modelos, as trilhas são interrompidas no meio. Nesse caso, una as duas metades com um jumper.

**Legenda:** Confira as marcas da sua protoboard. Em alguns modelos, as trilhas são interrompidas no meio: nesse caso, una as duas metades com um jumper.


## PASSO 1 DE 8 · Alimentação da protoboard

**2:08–2:23** · _Na tela:_ Fonte desligada: + na trilha + e GND na trilha − (em cima)

**Fala:** Passo um. Com a fonte desligada, ligue o positivo de cinco volts na trilha positiva de cima, e o GND na trilha negativa de cima. A fonte só vai ser ligada no final.

**Legenda:** Passo 1: com a fonte desligada, ligue o positivo de 5 V à trilha + de cima e o GND à trilha − de cima. Ela só será ligada no final.

**2:23–2:38** · _Na tela:_ Pontes na direita: + com + (col. 30) e − com − (col. 29)

**Fala:** Leve o positivo e o GND também para as trilhas de baixo, com dois jumpers na ponta direita da protoboard: o vermelho liga positivo com positivo, e o preto liga negativo com negativo.

**Legenda:** Leve +5 V e GND também às trilhas de baixo com dois jumpers na ponta direita: o vermelho liga + com +, e o preto liga − com −.


## PASSO 2 DE 8 · Posicionar o LM358

**2:38–2:53** · _Na tela:_ Ache a meia-lua: o pino 1 fica ao lado dela

**Fala:** Passo dois. Pegue o LM358 e encontre a meia-lua, ou o pontinho, no corpo do chip. Ela marca o pino um, e a contagem dos pinos segue no sentido anti-horário.

**Legenda:** Passo 2: pegue o LM358 e encontre a meia-lua (ou o pontinho) no corpo do chip. Ela marca o pino 1, e a contagem segue no sentido anti-horário.

**2:53–3:10** · _Na tela:_ Chip sobre o canal, colunas 15 a 18, meia-lua à esquerda

**Fala:** Encaixe o chip sobre o canal central, nas colunas quinze a dezoito, com a meia-lua virada para a esquerda. Os pinos um a quatro ficam embaixo, e os pinos oito a cinco ficam em cima.

**Legenda:** Encaixe o chip sobre o canal central, nas colunas 15 a 18, com a meia-lua para a esquerda. Os pinos 1 a 4 ficam embaixo e os pinos 8 a 5, em cima.

**3:10–3:26** · _Na tela:_ Usaremos o amplificador A: pinos 1, 2 e 3

**Fala:** Vamos usar o primeiro amplificador do chip. O pino três recebe a tensão de soma. O pino dois recebe o limiar, que é a tensão de referência. E o pino um é a saída, que acende o LED.

**Legenda:** Vamos usar o primeiro amplificador: o pino 3 recebe a soma VS, o pino 2 recebe o limiar Vref e o pino 1 é a saída que acende o LED.


## PASSO 3 DE 8 · Alimentar o LM358

**3:26–3:37** · _Na tela:_ Pino 8 → +5 V: jumper a15 → trilha +

**Fala:** Passo três. Ligue o pino oito ao positivo de cinco volts, com um jumper vermelho, do furo A15 até a trilha positiva de cima.

**Legenda:** Passo 3: ligue o pino 8 ao +5 V com um jumper vermelho, do furo a15 até a trilha + de cima.

**3:37–3:48** · _Na tela:_ Pino 4 → GND: jumper j18 → trilha −

**Fala:** Ligue o pino quatro ao GND, com um jumper preto, do furo J18 até a trilha negativa de baixo.

**Legenda:** Ligue o pino 4 ao GND com um jumper preto, do furo j18 até a trilha − de baixo.

**3:48–4:03** · _Na tela:_ Capacitor 100 nF entre + e −, ao lado do chip

**Fala:** Coloque o capacitor de cem nanofarads entre o positivo e o GND, bem ao lado do chip. É o mesmo que ligar o capacitor entre os pinos oito e quatro, e ele estabiliza a alimentação.

**Legenda:** Coloque o capacitor de 100 nF entre +5 V e GND, bem ao lado do chip. É o mesmo que ligá-lo entre os pinos 8 e 4, e ele estabiliza a alimentação.


## PASSO 4 DE 8 · Segundo amplificador

**4:03–4:18** · _Na tela:_ Pino 5 → GND: jumper a18 → trilha −

**Fala:** Passo quatro. O segundo amplificador não vai ser usado, mas não pode ficar com as entradas soltas. Ligue o pino cinco ao GND, com um jumper do furo A18 até a trilha negativa.

**Legenda:** Passo 4: o segundo amplificador não será usado, mas não pode ficar com as entradas soltas. Ligue o pino 5 ao GND: jumper de a18 até a trilha −.

**4:18–4:34** · _Na tela:_ Pino 6 ↔ pino 7: jumper c16 → c17

**Fala:** Agora ligue o pino seis ao pino sete, com um jumper curto, do furo C16 ao furo C17. Assim, o segundo amplificador fica quieto, funcionando como um seguidor de zero volt.

**Legenda:** Agora ligue o pino 6 ao pino 7 com um jumper curto, de c16 a c17. Assim o segundo amplificador fica quieto, como um seguidor de 0 V.


## PASSO 5 DE 8 · Chaves de entrada

**4:34–4:48** · _Na tela:_ Chave x1 em g1, g2, g3 (comum = g2)

**Fala:** Passo cinco. Encaixe a chave da entrada xis um nos furos G1, G2 e G3. O terminal do meio, o G2, é o comum: é ele que vai para o resistor.

**Legenda:** Passo 5: encaixe a chave da entrada x1 nos furos g1, g2 e g3. O terminal do meio, g2, é o comum: é ele que vai para o resistor.

**4:48–5:05** · _Na tela:_ j1 → +5 V e j3 → GND

**Fala:** Ligue um terminal lateral ao positivo, com um jumper de J1 até a trilha positiva, e o outro terminal ao GND, de J3 até a trilha negativa. Assim, a chave escolhe entre zero e cinco volts.

**Legenda:** Ligue um terminal lateral ao +5 V (jumper de j1 até a trilha +) e o outro ao GND (de j3 até a trilha −). A chave escolhe entre 0 V e 5 V.

**5:05–5:20** · _Na tela:_ Chave x2 em g8, g9, g10; j8 → +5 V e j10 → GND

**Fala:** Repita para a entrada xis dois: chave nos furos G8, G9 e G10, um jumper de J8 até o positivo, e outro de J10 até o GND.

**Legenda:** Repita para a entrada x2: chave em g8, g9 e g10, jumper de j8 até o +5 V e de j10 até o GND.

**5:20–5:32** · _Na tela:_ Confira o comum com o multímetro

**Fala:** Atenção: confira com o multímetro qual terminal é o comum da sua chave, porque a posição da alavanca não garante isso. E nunca ligue o positivo direto no GND.

**Legenda:** Atenção: confira com o multímetro qual terminal é o comum da sua chave, pois a posição da alavanca não garante isso. E nunca ligue +5 V direto no GND.


## PASSO 6 DE 8 · Nó de soma

**5:32–5:47** · _Na tela:_ R1 (10 kΩ): f2 → f5

**Fala:** Passo seis. A coluna cinco vai ser o nó de soma. Ligue o resistor R1, de dez quilo-ohms, do furo F2, que é o comum da chave xis um, até o furo F5.

**Legenda:** Passo 6: a coluna 5 será o nó de soma, VS. Ligue R1, de 10 kΩ, do furo f2 (comum da chave x1) até f5.

**5:47–5:56** · _Na tela:_ R2 (10 kΩ): i9 → i5

**Fala:** Ligue o R2, também de dez quilo-ohms, do furo I9, que é o comum da chave xis dois, até o furo I5.

**Legenda:** Ligue R2, também de 10 kΩ, do furo i9 (comum da chave x2) até i5.

**5:56–6:10** · _Na tela:_ R0 (4,7 kΩ): j5 → trilha −

**Fala:** Ligue o R0, de quatro vírgula sete quilo-ohms, do furo J5 até a trilha de GND. Ele puxa o nó para zero volt quando as duas chaves estão em zero.

**Legenda:** Ligue R0, de 4,7 kΩ, do furo j5 até a trilha GND. Ele puxa o nó para 0 V quando as duas chaves estão em 0.

**6:10–6:23** · _Na tela:_ VS → pino 3: jumper h5 → h17

**Fala:** Por fim, leve a tensão de soma até o pino três do LM358, com um jumper amarelo, do furo H5 até o furo H17.

**Legenda:** Por fim, leve VS ao pino 3 do LM358 com um jumper amarelo, do furo h5 até h17.


## PASSO 7 DE 8 · Limiar com o potenciômetro

**6:23–6:40** · _Na tela:_ Potenciômetro em f11, f12, f13 (cursor = f12)

**Fala:** Passo sete. O potenciômetro de dez quilo-ohms gera o limiar. Encaixe o potenciômetro nos furos F11, F12 e F13. O terminal do meio, o F12, é o cursor.

**Legenda:** Passo 7: o potenciômetro de 10 kΩ gera o limiar. Encaixe-o nos furos f11, f12 e f13. O terminal do meio, f12, é o cursor.

**6:40–6:53** · _Na tela:_ j11 → +5 V e j13 → GND

**Fala:** Ligue um terminal externo ao positivo, com um jumper de J11 até a trilha positiva, e o outro terminal ao GND, de J13 até a trilha negativa.

**Legenda:** Ligue um terminal externo ao +5 V (jumper de j11 até a trilha +) e o outro ao GND (de j13 até a trilha −).

**6:53–7:09** · _Na tela:_ Cursor → pino 2: jumper i12 → i16

**Fala:** Leve o cursor até o pino dois do LM358, com um jumper verde, do furo I12 até o furo I16. Girando o potenciômetro, a tensão de referência varia entre zero e cinco volts.

**Legenda:** Leve o cursor ao pino 2 do LM358 com um jumper verde, do furo i12 até i16. Girando o potenciômetro, Vref varia entre 0 e 5 V.


## PASSO 8 DE 8 · Saída e LED

**7:09–7:20** · _Na tela:_ Pino 1 → coluna 21: jumper g15 → g21

**Fala:** Passo oito. Leve a saída, que é o pino um, para a direita, com um jumper laranja do furo G15 até o furo G21.

**Legenda:** Passo 8: leve a saída, o pino 1, para a direita com um jumper laranja, do furo g15 até g21.

**7:20–7:32** · _Na tela:_ Resistor 1 kΩ: h21 → h25

**Fala:** Coloque o resistor de um quilo-ohm do furo H21 até o furo H25. Ele limita a corrente do LED e nunca deve ser retirado.

**Legenda:** Coloque o resistor de 1 kΩ de h21 até h25. Ele limita a corrente do LED e nunca deve ser retirado.

**7:32–7:46** · _Na tela:_ LED: perna longa em g25, perna curta em g26

**Fala:** O LED tem polaridade. A perna longa, o ânodo, vai no furo G25, junto do resistor. A perna curta, o cátodo, do lado chato, vai no furo G26.

**Legenda:** O LED tem polaridade: a perna longa (ânodo) vai em g25, junto do resistor; a perna curta (cátodo, lado chato) vai em g26.

**7:46–7:58** · _Na tela:_ Cátodo → GND: jumper j26 → trilha −

**Fala:** Feche o circuito ligando a coluna vinte e seis ao GND, com um jumper preto do furo J26 até a trilha negativa. A montagem está completa!

**Legenda:** Feche o circuito ligando a coluna 26 ao GND, com um jumper preto de j26 até a trilha −. A montagem está completa!


## ANTES DE LIGAR · Revisão

**7:58–8:10**

**Fala:** Antes de ligar, revise: meia-lua para a esquerda, pino oito no positivo, pino quatro no GND, e nenhum fio ligando o positivo direto no GND.

**Legenda:** Antes de ligar, revise: meia-lua para a esquerda, pino 8 no +5 V, pino 4 no GND e nenhum fio ligando +5 V direto ao GND.

**8:10–8:24**

**Fala:** Confira também: a tensão de soma chegando no pino três, a tensão de referência no pino dois, o LED com a perna longa do lado do resistor, e todas as partes no mesmo GND.

**Legenda:** Confira também: VS no pino 3, Vref no pino 2, LED com a perna longa do lado do resistor e todas as partes no mesmo GND.


## TESTE · Ligar e calibrar

**8:24–8:35** · _Na tela:_ Ligue a fonte e meça entre + e −: cerca de 5 V

**Fala:** Tudo certo? Ligue a fonte. Com o multímetro em tensão contínua, meça entre as trilhas positiva e negativa: o valor deve ficar perto de cinco volts.

**Legenda:** Tudo certo? Ligue a fonte. Com o multímetro em tensão contínua, meça entre as trilhas + e −: o valor deve ficar perto de 5 V.

**8:35–8:48** · _Na tela:_ Meça o cursor (g12) e ajuste para cerca de 1,8 V

**Fala:** Agora meça o cursor do potenciômetro, no furo G12, em relação ao GND, e gire até a leitura ficar em cerca de um vírgula oito volts. Esse é o limiar da função AND.

**Legenda:** Agora meça o cursor do potenciômetro (furo g12) em relação ao GND e gire até cerca de 1,8 V. Esse é o limiar da função AND.


## TESTE · Função AND

**8:48–9:00**

**Fala:** Teste as quatro combinações, medindo a tensão de soma na coluna cinco. Com as duas entradas em zero, a tensão é zero volt, abaixo do limiar. LED apagado.

**Legenda:** Teste as quatro combinações medindo VS na coluna 5. Com x1 = 0 e x2 = 0, VS = 0 V, abaixo do limiar: LED apagado.

**9:00–9:11**

**Fala:** Primeira entrada em zero e segunda em um: a tensão fica em cerca de um vírgula vinte e um volts, ainda abaixo de um vírgula oito. LED apagado.

**Legenda:** x1 = 0 e x2 = 1: VS ≈ 1,21 V, ainda abaixo de 1,8 V. LED apagado.

**9:11–9:19**

**Fala:** Primeira entrada em um e segunda em zero: o mesmo valor, cerca de um vírgula vinte e um volts. LED apagado.

**Legenda:** x1 = 1 e x2 = 0: o mesmo valor, cerca de 1,21 V. LED apagado.

**9:19–9:31**

**Fala:** As duas entradas em um: a tensão chega a cerca de dois vírgula quarenta e dois volts, acima do limiar. O LED acende. O circuito implementa a função AND!

**Legenda:** x1 = 1 e x2 = 1: VS ≈ 2,42 V, acima do limiar. O LED acende — o circuito implementa a função AND!

**9:31–9:46**

**Fala:** Com o R0 de quatro vírgula sete quilo-ohms, as tensões ficam um pouco abaixo das teóricas com cinco quilo-ohms, que seriam um vírgula vinte e cinco e dois vírgula cinco volts. Vale o que você medir: anote tudo na folha de registro.

**Legenda:** Com R0 = 4,7 kΩ, as tensões ficam um pouco abaixo das teóricas com 5 kΩ (1,25 V e 2,50 V). Vale o que você medir: anote tudo na folha de registro.


## DIAGNÓSTICO · Se algo der errado

**9:46–9:58**

**Fala:** O LED nunca acende? Confira a polaridade do LED, a alimentação do LM358 nos pinos oito e quatro, o resistor de um quilo-ohm, e a tensão de referência.

**Legenda:** LED nunca acende? Confira a polaridade do LED, a alimentação do LM358 (pinos 8 e 4), o resistor de 1 kΩ e a tensão de referência.

**9:58–10:14**

**Fala:** O LED fica sempre aceso? Meça a tensão de soma e a tensão de referência. O limiar pode estar baixo demais, ou os fios dos pinos dois e três podem estar trocados.

**Legenda:** LED sempre aceso? Meça VS e Vref: o limiar pode estar baixo demais, ou os fios dos pinos 2 e 3 podem estar trocados.

**10:14–10:30**

**Fala:** As chaves não mudam nada? Verifique o terminal comum das chaves, e se o GND é o mesmo para todas as partes. O LED pisca? Afaste a tensão de referência das tensões medidas.

**Legenda:** As chaves não mudam nada? Verifique o comum das chaves e o GND comum. O LED pisca? Afaste Vref das tensões medidas.


## BÔNUS · O mesmo circuito faz OR

**10:30–10:43** · _Na tela:_ Gire o cursor até cerca de 0,6 V

**Fala:** Bônus: gire o potenciômetro até cerca de zero vírgula seis volt. Sem trocar nenhuma peça, o mesmo circuito passa a implementar a função OR.

**Legenda:** Bônus: gire o potenciômetro até cerca de 0,6 V. Sem trocar nenhuma peça, o mesmo circuito passa a implementar a função OR.

**10:43–10:55** · _Na tela:_ Teste: 00 apagado; 01, 10 e 11 acesos

**Fala:** Agora o LED acende em zero um, um zero e um um, e só fica apagado em zero zero. Quem decide a regra lógica é o limiar.

**Legenda:** Agora o LED acende em 01, 10 e 11, e só fica apagado em 00. Quem decide a regra lógica é o limiar.


## Resumo

**10:55–11:10**

**Fala:** Resumindo: dados rotulados, treino no R, pesos e viés, resistores e limiar, e a classificação física no LED. Bom experimento!

**Legenda:** Resumo: dados rotulados → treino em R → pesos e viés → resistores e limiar → classificação física. Bom experimento!

