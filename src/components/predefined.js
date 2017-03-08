/* Predefined payloads */
export default {
	ThingLambda_FIND: {
		lambda: 'ThingLambda',
		payload: JSON.stringify({
			action: 'FIND',
			query: {
				size: 3,
				query: {
					match_all: {}
				}
			}
		}, 0, 2)
	},
	ThingLambda_GET: {
		lambda: 'ThingLambda',
		payload: JSON.stringify({
			action: 'GET',
			attributes: {
				thingName: '00000275',
				shadow: null,
				label: null
			}
		}, 0, 2)
	},
	ThingTypeLambda_GET: {
		lambda: 'ThingTypeLambda',
		payload: JSON.stringify({
			action: 'GET',
			attributes: {
				id: '83'
			}
		}, 0, 2)
	},
	ThingTypeLambda_LIST: {
		lambda: 'ThingTypeLambda',
		payload: JSON.stringify({
			action: 'LIST'
		}, 0, 2)
	},
	UserLambda_GET: {
		lambda: 'UserLambda',
		payload: JSON.stringify({
			action: 'GET',
			attributes: {
				userName: 'Pwntus',
				firstName: null,
				roleName: null
			}
		}, 0, 2)
	},
	ObservationLambda_GET: {
		lambda: 'ObservationLambda',
		payload: JSON.stringify({
			action: 'FIND',
			query: {
				size: 1,
				trackScores: false,
				query: {
					bool: {
						must: [
							{
								range: {
									timestamp: {
										gte: 1483225200000,
										lte: 1488933133098
									}
								}
							},
							{
								terms: {
									thingName: [
										"00000273"
									]
								}
							}
						]
					}
				},
				aggs: {
					hist: {
						date_histogram: {
							field: 'timestamp',
							interval: '12h',
							time_zone: '+01:00',
							min_doc_count: 1,
							extended_bounds: {
								min: 1483225200000,
								max: 1488933133098
							}
						},
						aggs: {
							lsnr: {
								avg: {
									field: 'state.lsnr'
								}
							}
						}
					}
				}
			}
		}, 0, 2)
	}
}
