import template from '/js/utils/template.js';

export default class pagination {
    static paginationNumbers(currentPage, totalPages) {
        let out = [];
        let index = 1;

        while (index <= totalPages) {
            let isFirstPage = index == 1;

            let isPageBeforCurrent = index == currentPage - 1;
            let isCurrentPage = index == currentPage;
            let isPageAfterCurrent = index == currentPage + 1;

            let isLastPage = index == totalPages;

            if (
                isFirstPage ||
                isPageBeforCurrent ||
                isCurrentPage ||
                isPageAfterCurrent ||
                isLastPage
            ) {
                out.push(index);
                index++;
            } else {
                out.push('...');
                if (index < currentPage - 1) index = currentPage - 1;
                else if (index > currentPage + 1) index = totalPages;
                else index++;
            }
        }
        return out;
    }

    static async renderBar(
        totalCount,
        currentPage,
        totalPage,
        barContainerId = 'paginationBar'
    ) {
        const paginationData = {
            from: null,
            to: null,
            total: totalCount,
            pages: this.paginationNumbers(currentPage, totalPage),
            hasPreviousPage: currentPage > 1,
            hasNextPage: currentPage < totalPage,
            pageIsActive: function () {
                return this == currentPage;
            },
            pageIsNumber: function () {
                return !isNaN(this);
            },
        };

        console.log(paginationData)

        const barHtml = await template.load('paginationBar', {
            barContainerId: barContainerId,
            pagination: paginationData,
        });

        return barHtml;
    }

    static async onBtn(callBack, barContainerId = 'paginationBar') {
        const clickEvent = (event) => {
            if (!event.currentTarget.matches('[data-pagination-btn]')) return;
            callBack(event.currentTarget.dataset.paginationBtn, event)
        };
        document
            .querySelectorAll('#' + barContainerId + ' [data-pagination-btn]')
            .forEach((el) => el.addEventListener('click', clickEvent));
    }
}
