$.fn.format = function() {
    return this.each(function() {
        var $this = $(this);
        var time = $this.attr("datetime");
        var localTime = moment.utc(time).local().format();

        $this.attr("datetime", localTime).timeago();

        return this;
    });
};