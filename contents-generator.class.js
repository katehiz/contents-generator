class ContentsGenerator {
    constructor(container) {
        this.container = container || window.document.body;
        this.titles = $(container).find('h1, h2, h3, h4, h5, h6');
    }

    hasTitles() {
        return this.titles.length !== 0;
    }

    static transliterate(str) {
        str = str.toLowerCase().replace(/<.+>/, ' ').replace(/\s+/, ' ');
        let newStr = "";
        const c = {
            'а':'a', 'б':'b', 'в':'v', 'г':'g', 'д':'d', 'е':'e', 'ё':'jo', 'ж':'zh', 'з':'z', 'и':'i', 'й':'j', 'к':'k', 'л':'l', 'м':'m', 'н':'n', 'о':'o', 'п':'p', 'р':'r', 'с':'s', 'т':'t', 'у':'u', 'ф':'f', 'х':'h', 'ц':'c', 'ч':'ch', 'ш':'sh', 'щ':'shch', 'ъ':'', 'ы':'y', 'ь':'', 'э':'e', 'ю':'ju', 'я':'ja', ' ':'-', ';':'', ':':'', ',':'', '—':'-', '–':'-', '.':'', '«':'', '»':'', '"':'', "'":'', '@':'', '?':'', '!':''
        };
        for (let i = 0; i < str.length; i++) {
            let ch = str.charAt(i);
            newStr += ch in c ? c[ch] : ch;
        }
        if (newStr.split('-').length > 5) {
            newStr = newStr.split('-').slice(0, 5).join('-');
        }
        return newStr;
    }

    static prepareTitles(titles) {
        titles.each(function (index, element) {
            $(element)
                .attr('name', ContentsGenerator.transliterate( $(element).text() ))
                .attr('data-level', element.tagName.substr(1));
        });
    }

    static generateHierarchy(titles) {
        let parentCurr = null,
            parentMain = 0,
            hierarchy = [];

        titles.each( function(index) {
            let level_next,
                level_current = parseInt( titles[index].dataset.level ),
                item = {
                    index: index,
                    level: level_current,
                    parent: parentCurr,
                    parent_main: parentMain
                };

            if ( titles[index+1] ) {
                level_next = parseInt( titles[index+1].dataset.level );

                // если следующий заголовок меньшего веса, то
                // текущим родителем становится текущий элемент (его индекс): 2, 3
                if (level_current < level_next) {
                    parentCurr = index;
                }

                // если следующий заголовок такого же веса, то
                // текущим родителем становится (остается) прежний 2, 2
                if ( level_next === level_current) {}

                // если следующий заголовок бОльшего веса, то
                // текущим родителем становится старший родитель 3, 2
                if (level_next < level_current) {
                    if (level_next <= titles[parentMain].dataset.level && parentMain === 0) {
                        parentCurr = null;
                    } else {
                        parentCurr = parentMain;
                    }
                }
            }

            // если вес текущего элемента >= главного веса, то
            // главным весом становится элемент с текущим индексом
            if ( level_current < titles[parentMain].dataset.level) {
                parentMain = index;
            }

            hierarchy[index] = item;
        });

        // отсев ненужных ключей: parent-main
        // увеличение значения parent на 1 для удобной работы в дальнейшем
        hierarchy
            .map( (elem) => {
                elem.parent = (elem.parent === null) ? 0 : elem.parent += 1;
                delete elem.parent_main;
                return elem;
            });

        return hierarchy;
    }

    static buildContents( titles, hierarchy ) {

        let titles_tree = [];

        const generateEmptyItem = (acc, item) => {
            let result = {
                text: $(item).text(),
                anchor: $(item).attr('name'),
                childrens: []
            };
            acc.push(result);
            return acc;
        };

        // формируем заготовки для будущего массива
        titles_tree = titles.toArray().reduce( generateEmptyItem, [] );

        // добавляем ключ parent каждому элементу в иерархии
        // инкубируем дочерние элементы в родительские
        hierarchy.forEach(function (item) {
            titles_tree[item.index].level = item.level;
            titles_tree[item.index].parent = item.parent;

            if (item.parent !== 0) {
                titles_tree[item.parent-1].childrens.push( titles_tree[item.index] );
            }
        });

        // осталяем только родителей
        titles_tree = titles_tree.filter( (elem) => elem.parent === 0);

        // формируем номера параграфов
        let outerIncrement = 1,
            h2_inc = 1,
            h3_inc = 1,
            h4_inc = 1,
            h5_inc = 1,
            h6_inc = 1;

        // устанавливаем номер параграфа для каждого заголовка содержания
        const setParagraphNumber = (currentValue, index) => {
            // счетчик цикла одного уровня
            let increment = (index + 1);

            if (currentValue === undefined) return;

            // формируем параграф. Это псевдоколдунство, не изящное но годное
            if (currentValue.parent === 0) {
                outerIncrement = index + 1; // сброс
                currentValue.paragraph = increment + '.';
                h2_inc = 1;
                h3_inc = 1;
                h4_inc = 1;
                h5_inc = 1;
                h6_inc = 1;
            } else {
                switch (currentValue.level) {
                    case 2:
                        currentValue.paragraph = outerIncrement + '.' + h3_inc + '.';
                        h2_inc++;
                        h3_inc = 1;
                        h4_inc = 1;
                        h5_inc = 1;
                        h6_inc = 1;
                        break;
                    case 3:
                        currentValue.paragraph = outerIncrement + '.' + h3_inc + '.';
                        h3_inc++;
                        h4_inc = 1;
                        h5_inc = 1;
                        h6_inc = 1;
                        break;
                    case 4:
                        currentValue.paragraph = outerIncrement + '.' + (h3_inc-1) + '.' + h4_inc + '.';
                        h4_inc++;
                        h5_inc = 1;
                        h6_inc = 1;
                        break;
                    case 5:
                        currentValue.paragraph = outerIncrement + '.' + (h3_inc-1) + '.' + (h4_inc-1) + '.' + h5_inc + '.';
                        h5_inc++;
                        h6_inc = 1;
                        break;
                    case 6:
                        currentValue.paragraph = outerIncrement + '.' + (h3_inc-1) + '.' + (h4_inc-1) + '.' + (h5_inc-1) + '.' + h6_inc + '.';
                        h6_inc++;
                        break;
                }
            }

            // формируем параграфы для дочерних
            // Если у текущего элемента есть дети
            if (currentValue.childrens.length !== 0) {
                currentValue.childrens.forEach( function(element, index) {
                    setParagraphNumber(element, index);
                });
            }

            return currentValue;
        };
        titles_tree = titles_tree.map( setParagraphNumber );

        return titles_tree;
    }

    generate() {
        if ( !this.hasTitles() ) return '';
        this.constructor.prepareTitles(this.titles);

        const parseLi = (acc, title) => {
            acc += `<li><span>${title.paragraph}</span> <a href="#${title.anchor}" class="link-anchor">${title.text}</a>`;
            if ( title.childrens.length !== 0 ) {
                acc += "<ul>";
                acc += title.childrens.reduce(parseLi, '');
                acc += "</ul>";
            }
            acc += "</li>";
            return acc;
        };

        let data = this.constructor.buildContents( this.titles, this.constructor.generateHierarchy(this.titles) );
        return data.reduce(parseLi, '');
    }
}