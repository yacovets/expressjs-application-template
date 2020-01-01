import request from 'request'
import moment from 'moment'

export function convFileSize(b){

    let fsize
	let fsizekb = b / 1024;
    let fsizemb = fsizekb / 1024;
	let fsizegb = fsizemb / 1024;
	let fsizetb = fsizegb / 1024;

	if (fsizekb <= 1024) {
        fsize = fsizekb.toFixed(3) + ' KB';
	} else if (fsizekb >= 1024 && fsizemb <= 1024) {
		fsize = fsizemb.toFixed(3) + ' MB';
	} else if (fsizemb >= 1024 && fsizegb <= 1024) {
		fsize = fsizegb.toFixed(3) + ' GB';
	} else {
		fsize = fsizetb.toFixed(3) + ' TB';
	}

    return fsize;

}

export function awaitRequest(data) {

    return new Promise(function (resolve, reject) {

        request(data, function (error, res) {

            if (!error) {

                resolve(res)
            } else {

                reject(error)
            }
        })
    })
}

export function formatDateDb (data) {

	let newData = []

	data.data = JSON.stringify(data.data)
	data.data = JSON.parse(data.data)

	if (data.type === 'copy') {


		for (let i in data.data) {

			var copy = data.data[i];

			if (copy.createdAt) {

				copy.createdAtOriginal = copy.createdAt
				copy.createdAt = moment(copy.createdAt).format(data.format)
			}

			if (copy.updatedAt) {

				copy.updatedAtOriginal = copy.updatedAt
				copy.updatedAt = moment(copy.updatedAt).format(data.format)
			}

			newData.push(copy);
		}
	} else {

		for (let i in data.data) {

			var copy = data.data[i];

			if (copy.createdAt) {

				copy.createdAt = moment(copy.createdAt).format(data.format)
			}

			if (copy.updatedAt) {
				copy.updatedAt = moment(copy.updatedAt).format(data.format)
			}

			newData.push(copy);
		}
	}

	return newData;
}