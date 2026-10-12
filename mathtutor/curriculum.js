/* Maths Buddy — curriculum map (White Rose Maths / Power Maths order) and parent lesson guides.
 * Week counts are approximate; the parent can override "what school is teaching this week" in the app.
 */
(function (root) {
'use strict';

const CALENDAR = {
  4: {
    autumn: [
      { block: 'Place value', weeks: 3, topics: ['y4-pv'] },
      { block: 'Addition and subtraction', weeks: 3, topics: ['y4-add', 'y4-sub'] },
      { block: 'Area', weeks: 1, topics: ['y4-meas'] },
      { block: 'Multiplication and division A', weeks: 4, topics: ['y4-tables', 'y4-mf'] },
      { block: 'Consolidation', weeks: 3, topics: ['y4-sub', 'y4-tables'] }
    ],
    spring: [
      { block: 'Multiplication and division B', weeks: 3, topics: ['y4-mul', 'y4-div'] },
      { block: 'Length and perimeter', weeks: 2, topics: ['y4-meas'] },
      { block: 'Fractions', weeks: 3, topics: ['y4-frac'] },
      { block: 'Decimals A', weeks: 3, topics: ['y4-dec'] }
    ],
    summer: [
      { block: 'Decimals B', weeks: 2, topics: ['y4-dec'] },
      { block: 'Money', weeks: 2, topics: [], soon: true },
      { block: 'Time', weeks: 1, topics: ['y4-time'] },
      { block: 'Shape', weeks: 2, topics: [], soon: true },
      { block: 'Statistics', weeks: 2, topics: [], soon: true },
      { block: 'Position and direction', weeks: 2, topics: [], soon: true }
    ]
  },
  6: {
    autumn: [
      { block: 'Place value', weeks: 2, topics: ['y6-pv'] },
      { block: 'Addition, subtraction, multiplication and division', weeks: 5, topics: ['y6-addsub', 'y6-mul', 'y6-div', 'y6-fmp', 'y6-ooo'] },
      { block: 'Fractions A', weeks: 2, topics: ['y6-frac'] },
      { block: 'Fractions B', weeks: 2, topics: ['y6-frac'] },
      { block: 'Converting units', weeks: 1, topics: ['y6-units'] },
      { block: 'Consolidation', weeks: 2, topics: ['y6-div', 'y6-pv'] }
    ],
    spring: [
      { block: 'Ratio', weeks: 2, topics: ['y6-ratio'] },
      { block: 'Algebra', weeks: 2, topics: ['y6-alg'] },
      { block: 'Decimals', weeks: 2, topics: ['y6-dec'] },
      { block: 'Fractions, decimals and percentages', weeks: 3, topics: ['y6-fdp'] },
      { block: 'Area, perimeter and volume', weeks: 2, topics: ['y6-apv'] },
      { block: 'Statistics', weeks: 1, topics: [], soon: true }
    ],
    summer: [
      { block: 'Shape', weeks: 3, topics: [], soon: true },
      { block: 'Position and direction', weeks: 1, topics: [], soon: true },
      { block: 'Revision & themed projects', weeks: 8, topics: ['y6-div', 'y6-frac', 'y6-fdp', 'y6-pv'] }
    ]
  }
};

const DEFAULT_TERMS = { autumn: '2026-08-24', spring: '2027-01-04', summer: '2027-04-12', end: '2027-07-02' };

/* ---------------------------------------------------------------------------
   Lesson guides for the parent. Short and practical: the school's method,
   what to say, what to ask (recall → explain → reason), and common mistakes.
   --------------------------------------------------------------------------- */
const L = {};

L['y4-pv'] = {
  nc: 'Recognise the place value of each digit in a 4-digit number; order and compare numbers beyond 1,000; find 1,000 more or less; round to the nearest 10, 100 or 1,000; count backwards through zero; read Roman numerals to 100.',
  vocab: ['place value', 'digit', 'partition', 'thousands / hundreds / tens / ones', 'place holder', 'round', 'negative number'],
  method: { name: 'Place value chart + base 10 / place value counters', steps: [
    'Build the number with base 10 or counters in a place value chart (Th | H | T | O).',
    'Say the value of each digit: "The 3 is in the hundreds column, so it is worth 300."',
    'Partition: 3,452 = 3,000 + 400 + 50 + 2. Then flexibly: 3,452 = 3,000 + 300 + 152.',
    'Rounding: draw a number line between the two multiples, mark the halfway point, see which side the number is on.'] },
  cpa: { c: 'Place value counters or base 10 in a chart drawn on paper.', p: 'Draw the chart and counters as dots; number lines for rounding.', a: 'Digits only: "What is the value of the 7 in 7,215?"' },
  say: ['"Each column is 10 times bigger than the column to its right."', '"Zero is a place holder — it keeps the other digits in the right column."', '"When we round, we ask: which multiple is it closer to?"'],
  ask: ['What is the value of the 4 in 4,302? (recall)', 'Why do we need the 0 in 4,302? (explain)', 'Can you make the largest number with 3, 0, 8, 5? How do you know it\'s the largest? (reason)'],
  mistakes: [['Reads 4,052 as "four hundred and fifty-two".', 'Put it in a chart — show the thousands column is filled and the hundreds column is empty.'],
    ['Rounds 3,450 down to 3,000 (looks at the wrong digit).', 'Underline the column you are rounding to, then look only at the digit to its right.'],
    ['1,000 more than 9,500 → writes 9,1500.', 'Use counters: exchange 10 thousands for 1 ten thousand.']],
  home: 'Price tags in the mall: "Which costs more, AED 1,299 or AED 1,929? Round them to the nearest 100."',
  example: 'pv4-value'
};
L['y4-add'] = {
  nc: 'Add numbers with up to 4 digits using the formal written method of column addition where appropriate; estimate and use inverse operations to check answers.',
  vocab: ['column addition', 'exchange', 'total', 'sum', 'estimate', 'inverse'],
  method: { name: 'Column addition (with exchanging)', steps: [
    'Estimate first: round both numbers to the nearest 100 or 1,000.',
    'Line up the digits: ones under ones, tens under tens.',
    'Start with the ONES. If a column makes 10 or more, write the ones digit and exchange 10 for 1 in the next column (write the small 1 below the line).',
    'Add the exchanged 1 when you add the next column.',
    'Compare the answer to the estimate.'] },
  cpa: { c: 'Base 10 blocks: physically swap 10 ones for 1 ten.', p: 'Draw place value counters in columns; circle groups of 10.', a: 'Column method on squared paper (one digit per square).' },
  say: ['"We don\'t \'carry\' — we exchange 10 ones for 1 ten."', '"Always start with the ones."'],
  ask: ['Where do we write the exchanged 1? (recall)', 'Why do we start with the ones and not the thousands? (explain)', 'Is 3,456 + 2,789 more or less than 6,000? How can you tell without calculating? (reason)'],
  mistakes: [['Writes 13 in the ones column.', 'Use base 10: 13 ones can\'t stay in the ones — exchange 10 of them.'], ['Forgets to add the exchanged digit.', 'Ask them to write it clearly and tick it when used.'], ['Misaligned digits when numbers have different lengths.', 'Use squared paper; write the ones first, right-aligned.']],
  home: 'Add two family shopping receipts together and check against the bank app.',
  example: 'add4-more'
};
L['y4-sub'] = {
  nc: 'Subtract numbers with up to 4 digits using the formal written method of column subtraction where appropriate; estimate and use inverse operations to check answers.',
  vocab: ['column subtraction', 'exchange', 'difference', 'minuend / subtrahend (not needed for kids)', 'inverse', 'place holder'],
  method: { name: 'Column subtraction (with exchanging)', steps: [
    'Bigger number on top. Line up the digits in columns.',
    'Start with the ONES. Ask: "Is the top digit big enough?"',
    'If not, EXCHANGE: go to the next column, cross out the digit, write one less above it, and put a small 1 in front of the digit you need (it is now 10 more).',
    'Exchanging across zero (e.g. 4,003 − 1,257): the tens and hundreds are 0, so go to the thousands: 4 → 3, the hundreds 0 → 10, then 10 → 9 as you pass one ten along, the tens 0 → 10 → 9, and the ones 3 → 13.',
    'Check with the inverse: answer + the number you subtracted = the top number.'] },
  cpa: { c: 'Place value counters: physically swap 1 hundred for 10 tens before you can take away.', p: 'Draw counters; cross out the ones you take away; draw the exchange with an arrow.', a: 'Column method with the crossings shown neatly above the top number.' },
  say: ['"We don\'t \'borrow\' — we exchange. Nothing is given back."', '"Can I take 8 ones from 3 ones? No — so I exchange 1 ten for 10 ones."', '"If the next column is zero, it has nothing to give, so we go further left."'],
  ask: ['What does the small 1 next to the digit mean? (recall)', 'Why does the 4 thousands become 3? Where did the thousand go? (explain)', 'Is it always true that the answer + the smaller number = the bigger number? Show me. (reason)'],
  mistakes: [['Takes the smaller digit from the bigger in every column (e.g. 52 − 38 → 26).', 'Ask "Is the TOP digit big enough?" before every column. Model with counters.'],
    ['Exchanges but forgets to reduce the digit she took from.', 'Cross out and rewrite every time — make it a habit, even when it feels slow.'],
    ['Exchanging across zero: changes 0 into 10 but then forgets the next exchange (leaves 10 instead of 9).', 'Do it with counters once: 1 hundred → 10 tens, then 1 of those tens → 10 ones. Say "10 tens, give one away, 9 tens left".'],
    ['Puts the smaller number on top.', 'Estimate first so she knows roughly what the answer should be.']],
  home: 'Countdown to a birthday or holiday in days; or "We had AED 2,000, we spent AED 1,465. How much is left?"',
  example: 'sub4-zero'
};
L['y4-tables'] = {
  nc: 'Recall multiplication and division facts for multiplication tables up to 12 × 12 (tested in the Year 4 Multiplication Tables Check: 25 questions, 6 seconds each).',
  vocab: ['multiply', 'times', 'groups of', 'product', 'factor', 'multiple', 'commutative', 'inverse', 'array'],
  method: { name: 'Use known facts (derived facts strategies)', steps: [
    '×2 double · ×4 double double · ×8 double double double.',
    '×5 is half of ×10 · ×10 shifts digits one place left.',
    '×3: ×2 and one more group · ×6: ×5 and one more group (or double ×3).',
    '×9: ×10 then take one group away · ×7: ×5 + ×2.',
    '×11: up to 9 the digit repeats; then ×10 + one group · ×12: ×10 + ×2.',
    'Turn every fact around (commutative: 7 × 8 = 8 × 7) and into division (56 ÷ 7 = 8).'] },
  cpa: { c: 'Lego bricks, buttons or counters in equal rows (arrays).', p: 'Draw arrays of dots; number lines with equal jumps.', a: 'Fact recall: 7 × 8 = ? and 56 ÷ 7 = ?' },
  say: ['"If you don\'t know it, build it from one you do know."', '"7 × 8 and 8 × 7 are the same fact — one fact, two questions."', '"Fast is good, but we learn it first, then we get fast."'],
  ask: ['What is 6 × 7? (recall)', 'How could you work out 9 × 7 if you forgot it? (explain)', 'If 7 × 8 = 56, what else do you know? (reason — 56 ÷ 8, 70 × 8, 14 × 8 …)'],
  mistakes: [['Counting in ones on fingers from zero every time.', 'Teach the anchor facts (×2, ×5, ×10) and derive from them.'], ['Mixes up 6×8 / 7×8 / 6×9.', 'Use the app\'s weak-table tracking; practise 2–3 facts a day, not whole tables.'], ['Freezes in timed tests.', 'Untimed practice first, then the Times Tables Check challenge once accuracy is above 90%.']],
  home: '2 minutes in the car: you say 7 × 6, she says 42 and the turnaround (6 × 7) and a division fact (42 ÷ 6).',
  example: 'tt-7-11-12'
};
L['y4-mf'] = {
  nc: 'Count in multiples of 6, 7, 9, 25 and 1,000; recognise and use factor pairs and commutativity in mental calculations.',
  vocab: ['multiple', 'factor', 'factor pair', 'common multiple', 'divisible'],
  method: { name: 'Multiples are "in the times table"; factors "go into" a number', steps: [
    'A multiple of 6 is any answer in the 6 times table: 6, 12, 18 … (it goes on for ever).',
    'Factors of 24 are the numbers that divide into 24 exactly. Find them in pairs: 1 × 24, 2 × 12, 3 × 8, 4 × 6.',
    'Work systematically: try 1, 2, 3, 4 … and stop when the pairs repeat.',
    'A common multiple is in BOTH times tables (12 is a multiple of 3 and of 4).'] },
  cpa: { c: 'Make arrays with 24 counters — how many different rectangles?', p: 'Draw the arrays; circle multiples on a 100 square.', a: '"Is 63 a multiple of 7?"' },
  say: ['"Multiples are big: they come out of the times table. Factors are small: they go in."', '"Factors come in pairs."'],
  ask: ['Name three multiples of 7. (recall)', 'How do you know 45 is not a multiple of 6? (explain)', 'Which number under 30 has the most factors? (reason)'],
  mistakes: [['Confuses factor and multiple.', 'Use the "factors fit in, multiples multiply up" phrase and a 100-square.'], ['Misses factor pairs.', 'Always start at 1 and go up in order.']],
  home: 'Snack sharing: "We have 24 dates — how many different ways can we share them equally?"',
  example: 'mf4-pairs'
};
L['y4-mul'] = {
  nc: 'Multiply two-digit and three-digit numbers by a one-digit number using formal written layout; multiply by 10 and 100.',
  vocab: ['multiply', 'product', 'partition', 'column method', 'exchange', 'place holder'],
  method: { name: 'Partitioning → expanded → short column multiplication', steps: [
    'Partition: 24 × 6 = 20 × 6 + 4 × 6 = 120 + 24 = 144.',
    'Column method: multiply the ONES first (4 × 6 = 24: write 4, exchange 2 tens).',
    'Multiply the tens (2 × 6 = 12) then ADD the exchanged 2 → 14 tens.',
    'Multiplying by 10/100: the digits move 1/2 places left; 0 fills the empty column.'] },
  cpa: { c: 'Place value counters: 6 rows of 24.', p: 'Draw the counters / a grid method.', a: 'Short multiplication.' },
  say: ['"Multiply first, THEN add the exchanged digit."'],
  ask: ['What do you do with the 2 in 24? (recall)', 'Why do we add the exchanged tens after multiplying? (explain)', 'Estimate: will 312 × 4 be more or less than 1,200? (reason)'],
  mistakes: [['Adds the exchanged digit before multiplying.', 'Say the order out loud: "multiply, then add".'], ['×10 by "adding a zero" on decimals later.', 'Teach "digits move left" now — it works for decimals too.']],
  home: 'Price of 6 school shirts at AED 45 each.',
  example: 'mul4-2x1'
};
L['y4-div'] = {
  nc: 'Divide two- and three-digit numbers by a one-digit number (partitioning, short division), including with remainders; use division facts.',
  vocab: ['divide', 'share', 'group', 'remainder', 'short division ("bus stop")', 'exchange', 'inverse'],
  method: { name: 'Partitioning → short division (the bus stop)', steps: [
    'Know the fact families: 7 × 8 = 56 so 56 ÷ 8 = 7.',
    'Partition into "friendly" multiples: 72 ÷ 3 → 60 ÷ 3 + 12 ÷ 3 = 20 + 4 = 24.',
    'Short division: write 3 ) 72. How many 3s in 7 tens? 2 (6 tens), 1 ten left → exchange it for 10 ones → 12 ones. How many 3s in 12? 4. Answer 24.',
    'Remainders: 47 ÷ 5 = 9 r 2 (9 fives = 45, 2 left).',
    'In word problems, decide what the remainder means: round UP (extra minibus) or DOWN (only full boxes).'] },
  cpa: { c: 'Place value counters: share 72 into 3 groups, exchanging a ten for ones when you can\'t share it.', p: 'Draw the counters in 3 rows; part-whole model for partitioning.', a: 'Bus stop with small exchanged digits.' },
  say: ['"How many 3s in 7? Two, with one left over. That one ten is exchanged for 10 ones."', '"Division is the inverse of multiplication — check by multiplying back."'],
  ask: ['What is 63 ÷ 7? (recall)', 'Why did the 1 move next to the 2? (explain)', '45 children, 8 per minibus. Why is the answer 6, not 5 r 5? (reason)'],
  mistakes: [['Divides each digit separately and ignores the remainder (72 ÷ 3 → 2 and 0.6…).', 'Model with counters: the leftover ten must be exchanged.'],
    ['Writes the remainder as a decimal (9.2 for 9 r 2).', 'Use the r notation in Year 4 and say "2 left over".'], ['Remainder larger than the divisor.', 'Rule: the remainder must always be smaller than the number you divide by.']],
  home: 'Share a box of 50 sweets between 4 kids — how many each, how many left for Mum?',
  example: 'div4-3d'
};
L['y4-frac'] = {
  nc: 'Recognise and show families of common equivalent fractions; add and subtract fractions with the same denominator; find fractions of amounts.',
  vocab: ['numerator', 'denominator', 'equivalent', 'whole', 'part', 'non-unit fraction'],
  method: { name: 'Bar models', steps: [
    'Equivalent: multiply (or divide) the numerator and denominator by the same number.',
    'Same denominator: add/subtract the numerators only — the size of the parts doesn\'t change.',
    'Fraction of an amount: ÷ by the denominator (one part), × by the numerator.'] },
  cpa: { c: 'Paper strips folded into equal parts; fraction walls.', p: 'Bar models divided into equal parts.', a: '¾ of 20 = 20 ÷ 4 × 3 = 15.' },
  say: ['"The denominator tells us how many equal parts; the numerator how many we have."', '"Divide by the bottom, times by the top."'],
  ask: ['What is ¼ of 24? (recall)', 'Why don\'t we add the denominators? (explain)', 'Is ⅔ of 12 bigger than ¾ of 12? (reason)'],
  mistakes: [['2/7 + 3/7 = 5/14.', 'Use a bar model: sevenths stay sevenths.'], ['Thinks 1/8 > 1/4 because 8 > 4.', 'Fold paper: more parts means smaller parts.']],
  home: 'Pizza or a cake: "If we eat 3/8, how much is left?"',
  example: 'fr4-of'
};
L['y4-dec'] = {
  nc: 'Recognise and write decimal equivalents of tenths and hundredths; divide 1- or 2-digit numbers by 10 and 100; round decimals to the nearest whole number; compare decimals.',
  vocab: ['decimal point', 'tenths', 'hundredths', 'divide by 10/100'],
  method: { name: 'Place value chart with tenths and hundredths', steps: ['The columns continue after the decimal point: tenths, hundredths.', '÷10 moves digits one place right; ÷100 two places right. The decimal point does not move.', 'Compare decimals column by column from the left.'] },
  cpa: { c: 'Money: AED 1 = 100 fils; hundred squares.', p: 'Shade hundred squares; place value chart.', a: '35 ÷ 100 = 0.35.' },
  say: ['"The digits move, not the decimal point."'],
  ask: ['What is 7 tenths as a decimal? (recall)', 'Why is 0.7 bigger than 0.65? (explain)', 'Order 0.5, 0.45, 0.405. (reason)'],
  mistakes: [['Thinks 0.45 > 0.5 because 45 > 5.', 'Write 0.5 as 0.50 and compare hundredths.']],
  home: 'Fils and dirhams on receipts.', example: 'dec4-div10'
};
L['y4-meas'] = {
  nc: 'Measure and calculate the perimeter of rectilinear figures; find the area of rectilinear shapes by counting squares; convert between units of length.',
  vocab: ['perimeter', 'area', 'square centimetres', 'length', 'width', 'rectilinear'],
  method: { name: 'Perimeter = all the way round; area = squares inside', steps: ['Perimeter: add all the sides (or 2 × (length + width)).', 'Area: count the squares, then notice rows × columns.', '1 km = 1,000 m · 1 m = 100 cm · 1 cm = 10 mm.'] },
  cpa: { c: 'Walk round a rug; cover a book with sticky notes.', p: 'Squared paper shapes.', a: 'Rectangle 7 cm × 4 cm, perimeter?' },
  say: ['"Perimeter is a fence; area is the grass inside."'], ask: ['What is the perimeter of a 5 cm square? (recall)', 'Can two shapes have the same area but different perimeters? (reason)'],
  mistakes: [['Adds only two sides for perimeter.', 'Trace the whole edge with a finger and count each side.']],
  home: 'Measure the perimeter of the dining table.', example: 'meas4-perim'
};
L['y4-time'] = {
  nc: 'Read, write and convert time between analogue and digital 12- and 24-hour clocks; convert hours to minutes, minutes to seconds, years to months, weeks to days.',
  vocab: ['am / pm', '24-hour clock', 'duration', 'minutes past / to'],
  method: { name: 'Time number line', steps: ['pm times: add 12 to the hour for the 24-hour clock.', 'Durations: count on to the next o\'clock, then whole hours, then the rest.'] },
  cpa: { c: 'A real clock with movable hands.', p: 'Time number lines.', a: '3:45 pm = 15:45.' },
  say: ['"24-hour times always have 4 digits."'], ask: ['What is 18:30 in 12-hour time? (recall)', 'How long from 2:35 pm to 4:10 pm? (apply)'],
  mistakes: [['Treats time like base 10 (1:50 + 20 min = 1:70).', 'Use a time number line — 60 minutes in an hour.']],
  home: 'Flight and cinema times on tickets.', example: 'time4-duration'
};
L['y4-cat4'] = L['y6-cat4'] = {
  nc: 'CAT4 Quantitative Reasoning: Number Series (find the next number) and Number Analogies (find the rule linking pairs). Not taught directly at school — it rewards spotting patterns quickly.',
  vocab: ['pattern', 'rule', 'sequence', 'difference'],
  method: { name: 'Pattern-spotting routine', steps: ['Write the difference between each pair of numbers.', 'Is the difference the same (+/−), growing, or alternating? If big jumps, try × or ÷.', 'Test your rule on EVERY pair before choosing an answer.', 'Analogies: find the rule for the first pair, check it on the second, apply it to the third.'] },
  cpa: { c: 'Build patterns with blocks.', p: 'Draw the jumps under the sequence.', a: '3, 7, 11, 15, ?' },
  say: ['"Check the rule works for every pair — not just the first one."'], ask: ['What is the rule? How did you check it? (reason)'],
  mistakes: [['Picks a rule that only fits the first pair.', 'Always test on the second pair.']],
  home: 'Car-number-plate patterns; make up a sequence for each other.', example: 'cat4-series'
};

L['y6-pv'] = {
  nc: 'Read, write, order and compare numbers up to 10,000,000 and determine the value of each digit; round any whole number; use negative numbers in context and calculate intervals across zero.',
  vocab: ['millions', 'place value', 'place holder', 'round', 'negative', 'interval'],
  method: { name: 'Place value chart split into millions | thousands | ones', steps: [
    'The commas split the number into groups of 3: millions, thousands, ones (H T O in each).',
    'Read each group then say its name: 4,306,020 → "four million, three hundred and six thousand, and twenty".',
    'Writing from words: every group after the millions needs exactly 3 digits — fill gaps with 0.',
    'Rounding: underline the column you are rounding to, look at the digit to its right.',
    'Negatives: use a number line; count to 0, then on.'] },
  cpa: { c: 'Place value counters in a 7-column chart.', p: 'Draw the chart; number lines (including below zero).', a: 'Value of the 6 in 3,640,205.' },
  say: ['"Each group of three has hundreds, tens and ones — of millions, of thousands, of ones."', '"Zero is a place holder; without it every digit slides into the wrong column."'],
  ask: ['What is the value of the 8 in 2,804,315? (recall)', 'Why does 300,000 need five zeros? (explain)', 'Which is closer to 5 million: 4,500,001 or 5,499,999? (reason)'],
  mistakes: [['Writes "two million and fifty thousand" as 2,50,000 or 250,000.', 'Draw the three groups first: _ , _ _ _ , _ _ _ and fill them.'],
    ['Rounds by looking at the wrong digit.', 'Underline the rounding column, circle the digit to its right.'], ['−6 to 9 → says 3 degrees.', 'Number line: count to 0 (6) and on to 9 (9) → 15.']],
  home: 'Dubai population (~3,800,000), Burj Khalifa visitors, football stadium capacities.',
  example: 'pv6-words'
};
L['y6-addsub'] = {
  nc: 'Solve addition and subtraction multi-step problems in contexts, deciding which operations and methods to use and why.',
  vocab: ['column method', 'exchange', 'inverse', 'estimate', 'multi-step'],
  method: { name: 'Column methods + bar models for word problems', steps: ['Draw a bar model to decide the operation.', 'Estimate, then calculate with columns (exchange where needed).', 'Check with the inverse.'] },
  cpa: { c: 'Counters for the exchanges if needed.', p: 'Bar models for multi-step problems.', a: 'Column methods.' },
  say: ['"What do we know? What are we finding? Which bar is missing?"'], ask: ['Which operation and why? (explain)', 'Is your answer sensible? How do you know? (reason)'],
  mistakes: [['Does only one step of a two-step problem.', 'Underline every number in the question and check each is used.']],
  home: 'Plan a trip budget from AED 5,000.', example: 'as6-word'
};
L['y6-mul'] = {
  nc: 'Multiply multi-digit numbers up to 4 digits by a two-digit whole number using the formal written method of long multiplication.',
  vocab: ['long multiplication', 'place holder', 'partial product', 'exchange'],
  method: { name: 'Long multiplication', steps: ['Multiply by the ones digit first (row 1).', 'Put a 0 place holder in the ones column, then multiply by the tens digit (row 2).', 'Add the two rows.', 'Estimate first: 3,248 × 27 ≈ 3,000 × 30 = 90,000.'] },
  cpa: { c: 'Place value counters for 2-digit × 2-digit.', p: 'Area/grid model to see the four partial products.', a: 'Long multiplication.' },
  say: ['"The 0 is there because we are really multiplying by 20, not 2."'], ask: ['Why do we write the 0? (explain)', 'How can you check your answer? (reason)'],
  mistakes: [['Forgets the place-holder 0.', 'Grid method side-by-side to show it is ×20.'], ['Mixes the exchanged digits from row 1 and row 2.', 'Cross out exchanged digits once used.']],
  home: 'Cost of 24 cinema tickets at AED 45.', example: 'mul6-4x2'
};
L['y6-div'] = {
  nc: 'Divide numbers up to 4 digits by a two-digit whole number using long division and short division, interpreting remainders as whole numbers, fractions, or by rounding, as appropriate for the context.',
  vocab: ['short division', 'long division', 'divisor', 'dividend', 'quotient', 'remainder', 'multiples'],
  method: { name: 'Short division (÷ 1 digit and easy 2-digit) → long division (÷ 2-digit)', steps: [
    'FIRST write the multiples of the divisor down the side (24, 48, 72, 96 …). This removes guessing.',
    'Short division: how many 24s in each part, exchange the remainder into the next digit.',
    'Long division: Divide → Multiply → Subtract → Bring down. Repeat.',
    'Remainders: as r (9 r 3), as a fraction (9 3/24 = 9 1/8), or as a decimal (keep dividing with .00).',
    'In context, decide whether to round up or down.'] },
  cpa: { c: 'Place value counters (÷ 1-digit) to show exchanging.', p: 'Bar model: the whole split into equal groups; multiples list.', a: 'Long division layout.' },
  say: ['"Divide, multiply, subtract, bring down."', '"Write the multiples first — every time."', '"The remainder must be smaller than the divisor."'],
  ask: ['What is 4,800 ÷ 6? (recall using facts)', 'Why do we bring the next digit down? (explain)', '437 ÷ 12 = 36 r 5. When would the answer be 37? When 36? (reason)'],
  mistakes: [['Guesses how many times the divisor goes in, then gets a negative/oversized remainder.', 'Insist on the multiples list.'],
    ['Loses place value: forgets a 0 in the quotient (e.g. 6,120 ÷ 12 = 51 instead of 510).', 'Every digit of the dividend gets a digit above it — even if it is 0.'],
    ['Writes remainder 5/12 as 0.5.', 'Remainder ÷ divisor: 5 ÷ 12. Practise r → fraction → decimal.']],
  home: 'Split a restaurant bill between friends; how many 12-packs of water for 150 people.',
  example: 'div6-long'
};
L['y6-fmp'] = {
  nc: 'Identify common factors, common multiples and prime numbers; recognise and use square and cube numbers.',
  vocab: ['factor', 'multiple', 'common factor', 'highest common factor (HCF)', 'common multiple', 'lowest common multiple (LCM)', 'prime', 'composite', 'square', 'cube'],
  method: { name: 'Lists and factor pairs', steps: [
    'Factors: find pairs systematically: 1 × 36, 2 × 18, 3 × 12, 4 × 9, 6 × 6 — stop when they meet.',
    'Common factors: list both sets, circle the ones in both; the biggest is the HCF.',
    'Common multiples: list multiples of the bigger number and check which the smaller divides into; the first is the LCM.',
    'Prime: exactly 2 factors (1 and itself). 1 is NOT prime. 2 is the only even prime.',
    'Divisibility checks: 3 — digits add to a multiple of 3; 9 — digits add to a multiple of 9; 4 — last two digits divide by 4.'] },
  cpa: { c: 'Make rectangles (arrays) with counters: prime numbers make only one rectangle.', p: 'Venn diagrams for common factors/multiples; 100-square (Sieve of Eratosthenes).', a: 'HCF of 24 and 36.' },
  say: ['"Factors go in, multiples multiply up."', '"Real-life clue words: \'every\' and \'next time together\' → multiples; \'share equally / packs / greatest\' → factors."'],
  ask: ['Is 51 prime? (recall/test)', 'Why is 1 not a prime number? (explain)', 'Buses every 6 and 8 minutes — when do they next leave together, and why does the LCM tell us? (reason)'],
  mistakes: [['Thinks 51, 57, 87 or 91 are prime.', 'Use the digit-sum test for 3; learn 7 × 13 = 91.'], ['Mixes HCF and LCM.', 'HCF is small (≤ the numbers); LCM is big (≥ the numbers).'], ['Misses factors.', 'Always work in pairs, in order.']],
  home: 'Plan party bags: 24 chocolates and 36 sweets, identical bags — most bags you can make?',
  example: 'fmp6-hcf'
};
L['y6-ooo'] = {
  nc: 'Use their knowledge of the order of operations to carry out calculations involving the four operations.',
  vocab: ['order of operations', 'brackets', 'BODMAS / BIDMAS (if the school uses it)'],
  method: { name: 'Brackets → × and ÷ → + and −', steps: ['Do anything in brackets first.', 'Then multiply and divide (left to right).', 'Then add and subtract (left to right).'] },
  cpa: { c: '—', p: 'Underline the part to do first.', a: '5 + 3 × 4 = 17.' }, say: ['"Brackets are the boss."'], ask: ['Why is 5 + 3 × 4 not 32? (explain)'],
  mistakes: [['Works strictly left to right.', 'Underline × and ÷ first and do them.']], home: 'Make 24 from 3, 4, 6, 2 using brackets.', example: 'ooo6-basic'
};
L['y6-frac'] = {
  nc: 'Simplify fractions; compare and order fractions; add and subtract fractions with different denominators and mixed numbers; multiply simple pairs of proper fractions; divide proper fractions by whole numbers.',
  vocab: ['simplify', 'common denominator', 'mixed number', 'improper fraction', 'equivalent'],
  method: { name: 'Bar models + common denominators', steps: [
    'Simplify: divide numerator and denominator by their HCF.',
    'Add/subtract: find a common denominator (a common multiple), convert, then add the numerators.',
    'Mixed numbers: add wholes and fractions separately, or convert to improper fractions (best for subtraction).',
    'Multiply: numerator × numerator, denominator × denominator.',
    'Divide by a whole number: divide the numerator if you can; otherwise multiply the denominator.'] },
  cpa: { c: 'Fraction walls/strips.', p: 'Bar models; area model for multiplying fractions.', a: '⅔ + ¼ = 8/12 + 3/12 = 11/12.' },
  say: ['"We can only add fractions when the parts are the same size."'], ask: ['What is 18/24 simplified? (recall)', 'Why does ½ × ⅓ make a smaller answer? (explain)', 'Which is greater, 5/8 or 3/5? Prove it. (reason)'],
  mistakes: [['Adds the denominators.', 'Bar model: the size of the parts doesn\'t change when you add.'], ['Forgets to convert the numerator when changing the denominator.', '"Whatever you do to the bottom, do to the top."']],
  home: 'Recipe halving and doubling.', example: 'fr6-addsub'
};
L['y6-dec'] = {
  nc: 'Multiply and divide numbers by 10, 100 and 1,000 giving answers up to three decimal places; multiply one-digit numbers with up to two decimal places by whole numbers; use written division methods where the answer has up to two decimal places.',
  vocab: ['decimal place', 'tenths', 'hundredths', 'thousandths'], method: { name: 'Place value chart and "make it whole"', steps: ['×/÷ 10, 100, 1,000: digits move 1, 2, 3 places.', '0.6 × 7: 6 × 7 = 42, then ÷ 10 = 4.2.', 'Division: short division keeping the decimal point lined up.'] },
  cpa: { c: 'Money and measures.', p: 'Place value charts.', a: '3.24 × 100 = 324.' }, say: ['"The digits move, not the point."'], ask: ['Why is 0.3 × 4 = 1.2 and not 0.12? (explain)'],
  mistakes: [['"Adds a zero" when multiplying decimals (3.4 × 10 = 3.40).', 'Use the place value chart every time.']], home: 'Fuel price × litres.', example: 'dec6-mul'
};
L['y6-fdp'] = {
  nc: 'Recall and use equivalences between simple fractions, decimals and percentages; solve problems involving the calculation of percentages.',
  vocab: ['per cent', 'equivalent', 'convert'], method: { name: 'Hundred square + 10% building blocks', steps: ['Fraction → decimal: make the denominator 10, 100 or 1,000.', 'Decimal → % : × 100.', 'Percentages of amounts: find 10% (÷10), 5% (half of 10%), 1% (÷100) and build.'] },
  cpa: { c: 'Hundred squares.', p: 'Bar models split into 10 parts.', a: '35% of 80 = 28.' }, say: ['"Per cent means out of 100."'], ask: ['What is ¾ as a %? (recall)', 'How would you find 15% of 60? (explain)'],
  mistakes: [['0.5 = 5%.', 'Hundred square: 0.5 = 50 hundredths = 50%.']], home: 'Sale prices: 25% off AED 240.', example: 'fdp6-pctof'
};
L['y6-ratio'] = {
  nc: 'Solve problems involving the relative sizes of two quantities; problems involving similar shapes where the scale factor is known; unequal sharing and grouping.',
  vocab: ['ratio', 'for every', 'proportion', 'scale factor'], method: { name: 'Bar models', steps: ['Draw a bar for each part of the ratio.', 'Find the value of one part.', 'Multiply to find what you need.'] },
  cpa: { c: 'Coloured cubes in ratio patterns.', p: 'Bar models.', a: 'Share 35 in the ratio 2 : 5.' }, say: ['"Find one part first."'], ask: ['How did you find one part? (explain)'],
  mistakes: [['Shares 35 in 2 : 5 as 2 and 5 → 17 and 18.', 'Bar model with 7 equal parts.']], home: 'Juice concentrate 1 : 4 with water.', example: 'rat6-share'
};
L['y6-alg'] = {
  nc: 'Use simple formulae; generate and describe linear number sequences; express missing number problems algebraically; find pairs of numbers that satisfy an equation with two unknowns.',
  vocab: ['expression', 'equation', 'substitute', 'unknown', 'term'], method: { name: 'Function machines and bar models', steps: ['3a means 3 × a.', 'Substitute: replace the letter with its value.', 'Solve: undo each step with the inverse (function machine backwards).'] },
  cpa: { c: 'Cups hiding counters.', p: 'Bar models for 2n + 5 = 17.', a: 'n = 6.' }, say: ['"A letter is just a number we don\'t know yet."'], ask: ['If a = 4, what is 5a? Why not 54? (explain)'],
  mistakes: [['Reads 3a as 3 + a or as 3a = 34.', '3a means 3 lots of a.']], home: 'Think-of-a-number puzzles.', example: 'alg6-solve'
};
L['y6-units'] = {
  nc: 'Convert between standard units of length, mass, volume and time using decimal notation; convert between miles and kilometres.',
  vocab: ['convert', 'kilo-', 'centi-', 'milli-'], method: { name: 'Know the facts, then × or ÷', steps: ['Big unit → small unit: ×.', 'Small → big: ÷.', '5 miles ≈ 8 km.'] },
  cpa: { c: 'Measuring jug, scales.', p: 'Double number lines.', a: '2.4 kg = 2,400 g.' }, say: ['"Bigger unit, fewer of them."'], ask: ['Why do we × to change km to m? (explain)'],
  mistakes: [['Multiplies when they should divide.', 'Ask: should the number get bigger or smaller?']], home: 'Recipes in grams; road signs in km.', example: 'unit6-metric'
};
L['y6-apv'] = {
  nc: 'Calculate the area of parallelograms and triangles; calculate, estimate and compare volume of cubes and cuboids; recognise shapes with the same areas can have different perimeters.',
  vocab: ['area', 'perimeter', 'volume', 'perpendicular height', 'cm², cm³'], method: { name: 'Formulae from rectangles', steps: ['Triangle = ½ × base × perpendicular height (half a rectangle).', 'Parallelogram = base × perpendicular height.', 'Cuboid volume = length × width × height.'] },
  cpa: { c: 'Cut a parallelogram into a rectangle; build cuboids with cubes.', p: 'Squared paper.', a: 'Formulae.' }, say: ['"A triangle is half a rectangle."'], ask: ['Why do we halve for a triangle? (explain)'],
  mistakes: [['Uses the slanted side instead of the perpendicular height.', 'The height must make a right angle with the base.']], home: 'Volume of a shoe box!', example: 'apv6-tri'
};

const api = { CALENDAR, DEFAULT_TERMS, LESSONS: L };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.MTCurriculum = api;
})(typeof window !== 'undefined' ? window : globalThis);
