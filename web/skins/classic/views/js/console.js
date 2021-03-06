function thumbnail_onmouseover(event) {
  var img = event.target;
  img.src = '';
  img.src = img.getAttribute('stream_src');
}

function thumbnail_onmouseout(event) {
  var img = event.target;
  img.src = '';
  img.src = img.getAttribute('still_src');
}

function initThumbAnimation() {
  $j('.colThumbnail img').each(function() {
    this.addEventListener('mouseover', thumbnail_onmouseover, false);
    this.addEventListener('mouseout', thumbnail_onmouseout, false);
  });
}

function setButtonStates( element ) {
  var form = element.form;
  var checked = 0;
  for ( var i=0; i < form.elements.length; i++ ) {
    if (
      form.elements[i].type=="checkbox" &&
      form.elements[i].name=="markMids[]"
    ) {
      var tr = $j(form.elements[i]).closest("tr");
      if ( form.elements[i].checked ) {
        checked ++;
        tr.addClass("danger");
      } else {
        tr.removeClass("danger");
      }
    }
  }
  if ( checked ) {
    form.editBtn.disabled = false;
    form.deleteBtn.disabled = false;
    form.selectBtn.disabled = false;
    if ( checked == 1 ) {
      $j(form.cloneBtn).css('display', 'inline');
    } else {
      form.cloneBtn.hide();
    }
  } else {
    form.cloneBtn.hide();
    form.editBtn.disabled = true;
    form.deleteBtn.disabled = true;
    form.selectBtn.disabled = true;
  }
}

function addMonitor(element) {
  window.location.assign('?view=monitor');
}

function cloneMonitor(element) {
  var form = element.form;
  var monitorId=-1;
  // get the value of the first checkbox
  for ( var i = 0; i < form.elements.length; i++ ) {
    if (
      form.elements[i].type == "checkbox" &&
      form.elements[i].name == "markMids[]" &&
      form.elements[i].checked
    ) {
      monitorId = form.elements[i].value;
      break;
    }
  } // end foreach element
  if ( monitorId != -1 ) {
    window.location.assign('?view=monitor&dupId='+monitorId);
  }
}

function editMonitor( element ) {
  var form = element.form;
  var monitorIds = Array();

  for ( var i = 0; i < form.elements.length; i++ ) {
    if (
      form.elements[i].type == "checkbox" &&
      form.elements[i].name == "markMids[]" &&
      form.elements[i].checked
    ) {
      monitorIds.push( form.elements[i].value );
      //form.elements[i].checked = false;
      //setButtonStates( form.elements[i] );
      //$(form.elements[i]).getParent( 'tr' ).removeClass( 'highlight' );
      //break;
    }
  } // end foreach checkboxes
  if ( monitorIds.length == 1 ) {
    window.location.assign('?view=monitor&mid='+monitorIds[0]);
  } else if ( monitorIds.length > 1 ) {
    window.location.assign( '?view=monitors&'+(monitorIds.map(function(mid) {
      return 'mids[]='+mid;
    }).join('&')));
  }
}

function deleteMonitor( element ) {
  if ( confirm( 'Warning, deleting a monitor also deletes all events and database entries associated with it.\nAre you sure you wish to delete?' ) ) {
    var form = element.form;
    form.elements['action'].value = 'delete';
    form.submit();
  }
}

function selectMonitor(element) {
  var form = element.form;
  var url = thisUrl+'?view=console';
  for ( var i = 0; i < form.elements.length; i++ ) {
    if (
      form.elements[i].type == 'checkbox' &&
      form.elements[i].name == 'markMids[]' &&
      form.elements[i].checked
    ) {
      url += '&MonitorId[]='+form.elements[i].value;
    }
  }
  window.location.replace(url);
}

function reloadWindow() {
  window.location.replace( thisUrl );
}

// Manage the the Function modal and its buttons
function manageFunctionModal() {
  $j('.functionLnk').click(function(evt) {
    evt.preventDefault();
    if ( !canEditEvents ) {
      enoperm();
      return;
    }
    var mid = evt.currentTarget.getAttribute('data-mid');
    monitor = monitors[mid];
    if ( !monitor ) {
      console.error("No monitor found for mid " + mid);
      return;
    }

    var function_form = document.getElementById('function_form');
    if ( !function_form ) {
      console.error("Unable to find form with id function_form");
      return;
    }
    function_form.elements['newFunction'].value = monitor.Function;
    function_form.elements['newEnabled'].checked = monitor.Enabled == '1';
    function_form.elements['mid'].value = mid;
    document.getElementById('function_monitor_name').innerHTML = monitor.Name;

    $j('#modalFunction').modal('show');
  });

  // Manage the CANCEL modal buttons
  $j('.funcCancelBtn').click(function(evt) {
    evt.preventDefault();
    $j('#modalFunction').modal('hide');
  });

  // Manage the SAVE modal buttons
  $j('.funcSaveBtn').click(function(evt) {
    evt.preventDefault();
    $j('#function_form').submit();
  });
}

function initPage() {
  reloadWindow.periodical(consoleRefreshTimeout);
  if ( showVersionPopup ) {
    window.location.assign('?view=version');
  }
  if ( showDonatePopup ) {
    $j.getJSON(thisUrl + '?request=modal&modal=donate')
        .done(function(data) {
          if ( $j('#donate').length ) {
            $j('#donate').replaceWith(data.html);
          } else {
            $j("body").append(data.html);
          }
          $j('#donate').modal('show');
          // Manage the Apply button
          $j('#donateApplyBtn').click(function(evt) {
            evt.preventDefault();
            $j('#donateForm').submit();
          });
        })
        .fail(logAjaxFail);
  }

  // Makes table sortable
  $j( function() {
    $j( "#consoleTableBody" ).sortable({
      handle: ".sort",
      update: applySort,
      axis: 'Y'} );
    $j( "#consoleTableBody" ).disableSelection();
  } );

  // Setup the thumbnail video animation
  initThumbAnimation();

  // Load the Function modal on page load
  $j.getJSON(thisUrl + '?request=modal&modal=function')
      .done(function(data) {
        if ( $j('#modalFunction').length ) {
          $j('#modalFunction').replaceWith(data.html);
        } else {
          $j("body").append(data.html);
        }
        // Manage the Function modal
        manageFunctionModal();
      })
      .fail(logAjaxFail);
}

function applySort(event, ui) {
  var monitor_ids = $j(this).sortable('toArray');
  var ajax = new Request.JSON( {
    url: 'index.php?request=console',
    data: {monitor_ids: monitor_ids, action: 'sort'},
    method: 'post',
    timeout: AJAX_TIMEOUT
  } );
  ajax.send();
} // end function applySort(event,ui)

window.addEventListener( 'DOMContentLoaded', initPage );
