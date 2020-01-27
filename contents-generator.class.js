class ContentsGenerator {
    constructor(container) {
        this.container = container || window.document.body;
        this.titles = this.constructor.prepareTitles(container);
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

    static prepareTitles(container) {
        let titles = $(container).find('h1, h2, h3, h4, h5, h6');
        titles.each(function (index, element) {
            $(element)
                .attr('name', ContentsGenerator.transliterate( $(element).text() ))
                .attr('data-level', element.tagName.substr(1));
        });
        return titles;
    }

    static generateFlatHierarchy(titles) {
        let parentMain = 0, // самый главный предок для текущей итерации
            hierarchy = [];

        const getElementLevel = function(index) {
            return parseInt(titles[index].dataset.level)
        };

        const getLastLevelElement = function(lastLevel) {
            let result = hierarchy.filter( (element) => element.level === lastLevel );
            if (result.length === 0) return undefined;
            return result[result.length - 1];
        };

        const getElementByIndex = function(index) {
            return hierarchy[index];
        };

        titles.each( function(index) {
            let level_prev = null,
                level_current = getElementLevel(index),
                parent_current = null,
                title_item;

            // если существует следующий объект после текущего, работаем
            if ( index > 0 && titles[index - 1] ) {
                level_prev = getElementLevel(index - 1);

                // если предыдущий заголовок большего веса(2 <- 3), то
                if (level_current > level_prev) {
                    parent_current = index - 1;
                }

                // если следующий заголовок такого же веса (2 -> 2), что и текущий, то
                // текущим родителем становится (остается) прежний
                if (level_current === level_prev) {
                    parent_current = getElementByIndex(index - 1).parent;
                }

                // если предыдущий заголовок меньшего веса (2 <- 1)
                if (level_current < level_prev) {
                    if (level_prev === getElementLevel(parentMain)) {
                        // для случаев, если следующий заголовок самого верхнего уровня - H1
                        parent_current = null;
                    } else {
                        // найти в массиве hierarchy последний элемент с таким же весом и вернуть его родителя
                        parent_current = getLastLevelElement(level_current).parent;
                    }
                }
            }

            // если вес текущего элемента больше главного веса, то
            // главным весом становится элемент с текущим индексом
            if ( level_current <= getElementLevel(parentMain) ) {
                parentMain = index;
            }

            title_item = {
                index: index,
                level: level_current,
                parent: parent_current
            };
            title_item.parent_main = parentMain;
            hierarchy[index] = title_item;
        });

        return hierarchy;
    }

    static generateHierarchy( titles, hierarchy ) {

        let titles_tree = [],
            // формируем номера параграфов
            outerIncrement = 1,
            //h2_inc = 1,
            h3_inc = 1,
            h4_inc = 1,
            h5_inc = 1,
            h6_inc = 1;

        // создание базовый объект для заголовка
        const generateEmptyItem = (acc, item) => {
            let result = {
                text: $(item).text(),
                anchor: $(item).attr('name'),
                childrens: []
            };
            acc.push(result);
            return acc;
        };

        // устанавливаем номер параграфа для каждого заголовка содержания
        const setParagraphNumber = (currentValue, index) => {
            // счетчик цикла одного уровня
            let increment = (index + 1);

            if (currentValue === undefined) return;

            // формируем параграф. Это псевдоколдунство, не изящное, но годное
            if (currentValue.parent === null) {
                outerIncrement = index + 1; // сброс
                currentValue.paragraph = increment + '.';
                //h2_inc = 1;
                h3_inc = 1;
                h4_inc = 1;
                h5_inc = 1;
                h6_inc = 1;
            } else {
                switch (currentValue.level) {
                    case 2:
                        currentValue.paragraph = outerIncrement + '.' + h3_inc + '.';
                        //h2_inc++;
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

        // формируем заготовки для будущего массива
        titles_tree = titles.toArray().reduce( generateEmptyItem, [] );

        // добавляем ключ parent каждому элементу в иерархии
        // инкубируем дочерние элементы в родительские
        hierarchy.forEach(function (item) {
            titles_tree[item.index].level = item.level;
            titles_tree[item.index].parent = item.parent;

            if (item.parent !== null) {
                titles_tree[item.parent].childrens.push( titles_tree[item.index] );
            }
        });

        // осталяем только родителей
        titles_tree = titles_tree.filter( (elem) => elem.parent === null);
        titles_tree = titles_tree.map( setParagraphNumber );

        return titles_tree;
    }

    static buildContents(hierarchy) {
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
        return hierarchy.reduce(parseLi, '');
    }

    generate() {
        if ( !this.hasTitles() ) return '';

        const
            generateFlatHierarchy = this.constructor.generateFlatHierarchy,
            generateHierarchy = this.constructor.generateHierarchy,
            buildContents = this.constructor.buildContents;

        let hierarchy = generateHierarchy( this.titles, generateFlatHierarchy(this.titles) );

        debugger;

        return buildContents(hierarchy);
    }
}